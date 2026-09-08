import { Router, Request, Response } from "express";
import { UserRole, UserStatus, ReportStatus, DisputeStatus, JobStatus } from "@prisma/client";
import prisma from "../lib/prisma";
import { authenticate, requireRole } from "../middleware/auth.middleware";
import { logAuditEvent } from "../lib/audit";

const router = Router();

// All routes in this router require ADMIN role
router.use(authenticate);
router.use(requireRole(UserRole.ADMIN));

// GET /admin/stats — Global platform statistics
router.get("/stats", async (_req: Request, res: Response): Promise<void> => {
  try {
    const [
      totalUsers,
      totalJobs,
      totalProposals,
      totalContracts,
      openDisputes,
      pendingReports,
      escrowAggr,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.job.count(),
      prisma.proposal.count(),
      prisma.contract.count(),
      prisma.dispute.count({ where: { status: "OPEN" } }),
      prisma.report.count({ where: { status: "OPEN" } }),
      prisma.contract.aggregate({ _sum: { escrowBalance: true, totalAmount: true } }),
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalJobs,
        totalProposals,
        totalContracts,
        openDisputes,
        pendingReports,
        totalEscrow: Number(escrowAggr._sum.escrowBalance || 0),
        totalVolume: Number(escrowAggr._sum.totalAmount || 0),
      },
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// GET /admin/users — List platform users
router.get("/users", async (req: Request, res: Response): Promise<void> => {
  try {
    const { role, status, search, page = "1", limit = "20" } = req.query;
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const take = Math.min(50, Math.max(1, parseInt(limit as string, 10) || 20));
    const skip = (pageNum - 1) * take;

    const where: any = {};
    if (role) where.role = role as UserRole;
    if (status) where.status = status as UserStatus;
    if (search) {
      const q = (search as string).trim();
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ];
    }

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          avatarUrl: true,
          createdAt: true,
          profile: {
            select: { headline: true, rating: true, completedJobs: true },
          },
        },
      }),
    ]);

    res.status(200).json({
      success: true,
      data: users,
      pagination: { total, page: pageNum, limit: take, totalPages: Math.ceil(total / take) },
    });
  } catch (error) {
    console.error("Admin list users error:", error);
    res.status(500).json({ success: false, error: "Failed to list users" });
  }
});

// PATCH /admin/users/:id/status — Suspend or activate user
router.patch("/users/:id/status", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { status } = req.body;

    if (!status || !Object.values(UserStatus).includes(status)) {
      res.status(400).json({ success: false, error: "Invalid user status" });
      return;
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { status: status as UserStatus },
      select: { id: true, email: true, name: true, status: true },
    });

    await logAuditEvent({
      actorId: req.user!.id,
      action: "USER_STATUS_CHANGE",
      entityType: "USER",
      entityId: id,
      metadata: { newStatus: status, userEmail: updated.email },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.status(200).json({
      success: true,
      message: `User status changed to ${status}`,
      user: updated,
    });
  } catch (error) {
    console.error("Admin update user status error:", error);
    res.status(500).json({ success: false, error: "Failed to update user status" });
  }
});

// GET /admin/reports — List moderation reports
router.get("/reports", async (_req: Request, res: Response): Promise<void> => {
  try {
    const reports = await prisma.report.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        reporter: { select: { id: true, name: true, email: true } },
        resolvedBy: { select: { id: true, name: true } },
      },
    });

    res.status(200).json({
      success: true,
      data: reports,
    });
  } catch (error) {
    console.error("Admin list reports error:", error);
    res.status(500).json({ success: false, error: "Failed to load reports" });
  }
});

// PATCH /admin/reports/:id/resolve — Resolve or dismiss report
router.patch("/reports/:id/resolve", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { status = "RESOLVED", resolutionNotes } = req.body;

    if (!Object.values(ReportStatus).includes(status)) {
      res.status(400).json({ success: false, error: "Invalid report status." });
      return;
    }

    const report = await prisma.report.update({
      where: { id },
      data: {
        status: status as ReportStatus,
        resolutionNotes: resolutionNotes || "Reviewed and resolved by platform administrator.",
        resolvedById: req.user!.id,
        resolvedAt: new Date(),
      },
    });

    await logAuditEvent({
      actorId: req.user!.id,
      action: "REPORT_RESOLVED",
      entityType: "REPORT",
      entityId: id,
      metadata: { status, resolutionNotes },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.status(200).json({
      success: true,
      message: `Report marked as ${status}.`,
      report,
    });
  } catch (error) {
    console.error("Admin resolve report error:", error);
    res.status(500).json({ success: false, error: "Failed to resolve report" });
  }
});

// GET /admin/disputes — List all disputes
router.get("/disputes", async (_req: Request, res: Response): Promise<void> => {
  try {
    const disputes = await prisma.dispute.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        openedBy: { select: { id: true, name: true, email: true } },
        resolvedBy: { select: { id: true, name: true } },
        contract: {
          select: {
            id: true,
            title: true,
            contractNumber: true,
            totalAmount: true,
            escrowBalance: true,
            client: { select: { id: true, name: true } },
            freelancer: { select: { id: true, name: true } },
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: disputes,
    });
  } catch (error) {
    console.error("Admin list disputes error:", error);
    res.status(500).json({ success: false, error: "Failed to list disputes" });
  }
});

// PATCH /admin/disputes/:id/resolve — Admin resolves dispute
router.patch("/disputes/:id/resolve", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { status = "RESOLVED", resolution } = req.body;

    if (!resolution || typeof resolution !== "string" || resolution.trim().length < 10) {
      res.status(400).json({
        success: false,
        error: "Resolution notes must be provided and contain at least 10 characters.",
      });
      return;
    }

    const updated = await prisma.dispute.update({
      where: { id },
      data: {
        status: status as DisputeStatus,
        resolution: resolution.trim(),
        resolvedById: req.user!.id,
        resolvedAt: new Date(),
      },
      include: { contract: true },
    });

    // Update contract status back to ACTIVE or COMPLETED depending on resolution
    if (status === "RESOLVED") {
      await prisma.contract.update({
        where: { id: updated.contractId },
        data: { status: "COMPLETED", completedAt: new Date() },
      });
    }

    await logAuditEvent({
      actorId: req.user!.id,
      action: "DISPUTE_RESOLVED",
      entityType: "DISPUTE",
      entityId: id,
      metadata: { resolution, status, contractId: updated.contractId },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.status(200).json({
      success: true,
      message: `Dispute marked as ${status}.`,
      dispute: updated,
    });
  } catch (error) {
    console.error("Admin resolve dispute error:", error);
    res.status(500).json({ success: false, error: "Failed to resolve dispute" });
  }
});

// GET /admin/audit-logs — Read-only platform audit log
router.get("/audit-logs", async (req: Request, res: Response): Promise<void> => {
  try {
    const { limit = "50" } = req.query;
    const take = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 50));

    const logs = await prisma.auditLog.findMany({
      take,
      orderBy: { createdAt: "desc" },
      include: {
        actor: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    res.status(200).json({
      success: true,
      data: logs,
    });
  } catch (error) {
    console.error("Fetch audit logs error:", error);
    res.status(500).json({ success: false, error: "Failed to load audit logs" });
  }
});

// GET /admin/health — Health check for admin
router.get("/health", async (_req: Request, res: Response): Promise<void> => {
  res.status(200).json({
    success: true,
    status: "HEALTHY",
    roleVerified: "ADMIN",
    timestamp: new Date().toISOString(),
  });
});

export default router;
