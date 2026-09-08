import { Router, Request, Response } from "express";
import { UserRole, UserStatus, ReportStatus, DisputeStatus, JobStatus, ProposalStatus, ContractStatus, TransactionType, TransactionStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
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

// POST /admin/users — Create new user account
router.post("/users", async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role, status = "ACTIVE" } = req.body;

    if (!name || !email || !password || !role) {
      res.status(400).json({
        success: false,
        error: "Name, email, password, and role are required.",
      });
      return;
    }

    if (!Object.values(UserRole).includes(role)) {
      res.status(400).json({ success: false, error: "Invalid role specified." });
      return;
    }

    const existing = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (existing) {
      res.status(400).json({ success: false, error: "A user with this email address already exists." });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        passwordHash,
        role: role as UserRole,
        status: (status as UserStatus) || UserStatus.ACTIVE,
        ...(role === UserRole.FREELANCER
          ? {
              profile: {
                create: {
                  headline: "Independent Professional",
                  bio: "Ready to take on new challenges and deliver high quality work.",
                  location: "Remote",
                  hourlyRate: 50.0,
                  rating: 5.0,
                  completedJobs: 0,
                },
              },
            }
          : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    await logAuditEvent({
      actorId: req.user!.id,
      action: "USER_CREATED",
      entityType: "USER",
      entityId: user.id,
      metadata: { role: user.role, email: user.email },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user,
    });
  } catch (error) {
    console.error("Admin create user error:", error);
    res.status(500).json({ success: false, error: "Failed to create user" });
  }
});

// PUT /admin/users/:id — Edit user details
router.put("/users/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { name, email, role, status } = req.body;

    const data: any = {};
    if (name) data.name = name.trim();
    if (email) data.email = email.trim().toLowerCase();
    if (role && Object.values(UserRole).includes(role)) data.role = role as UserRole;
    if (status && Object.values(UserStatus).includes(status)) data.status = status as UserStatus;

    const updated = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    await logAuditEvent({
      actorId: req.user!.id,
      action: "USER_UPDATED",
      entityType: "USER",
      entityId: id,
      metadata: data,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      user: updated,
    });
  } catch (error) {
    console.error("Admin edit user error:", error);
    res.status(500).json({ success: false, error: "Failed to update user" });
  }
});

// DELETE /admin/users/:id — Soft-deactivate user
router.delete("/users/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const updated = await prisma.user.update({
      where: { id },
      data: { status: UserStatus.SUSPENDED },
      select: { id: true, email: true, name: true, status: true },
    });

    await logAuditEvent({
      actorId: req.user!.id,
      action: "USER_DEACTIVATED",
      entityType: "USER",
      entityId: id,
      metadata: { email: updated.email },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.status(200).json({
      success: true,
      message: `User ${updated.email} has been deactivated and suspended.`,
      user: updated,
    });
  } catch (error) {
    console.error("Admin deactivate user error:", error);
    res.status(500).json({ success: false, error: "Failed to deactivate user" });
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

// ==========================================
// JOBS MANAGEMENT
// ==========================================

// GET /admin/jobs — List all marketplace jobs
router.get("/jobs", async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, category, search, page = "1", limit = "20" } = req.query;
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const take = Math.min(50, Math.max(1, parseInt(limit as string, 10) || 20));
    const skip = (pageNum - 1) * take;

    const where: any = {};
    if (status) where.status = status as JobStatus;
    if (category) where.category = { slug: category as string };
    if (search) {
      const q = (search as string).trim();
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ];
    }

    const [total, jobs] = await Promise.all([
      prisma.job.count({ where }),
      prisma.job.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          client: { select: { id: true, name: true, email: true, avatarUrl: true } },
          category: { select: { id: true, name: true, slug: true } },
          _count: { select: { proposals: true, contracts: true } },
        },
      }),
    ]);

    res.status(200).json({
      success: true,
      data: jobs.map((j) => ({
        id: j.id,
        title: j.title,
        description: j.description,
        status: j.status,
        budget: Number(j.budget),
        budgetType: j.budgetType,
        experienceLevel: j.experienceLevel,
        locationType: j.locationType,
        category: j.category.name,
        client: j.client,
        proposalsCount: j._count.proposals,
        contractsCount: j._count.contracts,
        createdAt: j.createdAt.toISOString(),
      })),
      pagination: { total, page: pageNum, limit: take, totalPages: Math.ceil(total / take) },
    });
  } catch (error) {
    console.error("Admin list jobs error:", error);
    res.status(500).json({ success: false, error: "Failed to list jobs" });
  }
});

// GET /admin/jobs/:id — Detailed job view
router.get("/jobs/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, name: true, email: true, avatarUrl: true } },
        category: { select: { id: true, name: true, slug: true } },
        skills: { include: { skill: true } },
        proposals: {
          include: {
            freelancer: { select: { id: true, name: true, email: true, avatarUrl: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        contracts: {
          include: {
            freelancer: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    if (!job) {
      res.status(404).json({ success: false, error: "Job not found" });
      return;
    }

    res.status(200).json({
      success: true,
      job: {
        id: job.id,
        title: job.title,
        description: job.description,
        status: job.status,
        budget: Number(job.budget),
        budgetType: job.budgetType,
        experienceLevel: job.experienceLevel,
        locationType: job.locationType,
        category: job.category.name,
        client: job.client,
        skills: job.skills.map((s) => ({ id: s.skill.id, name: s.skill.name })),
        proposals: job.proposals.map((p) => ({
          id: p.id,
          bidAmount: Number(p.bidAmount),
          estimatedDays: p.estimatedDays,
          status: p.status,
          coverLetter: p.coverLetter,
          freelancer: p.freelancer,
          createdAt: p.createdAt.toISOString(),
        })),
        contracts: job.contracts.map((c) => ({
          id: c.id,
          contractNumber: c.contractNumber,
          status: c.status,
          totalAmount: Number(c.totalAmount),
          freelancer: c.freelancer,
        })),
        createdAt: job.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Admin get job error:", error);
    res.status(500).json({ success: false, error: "Failed to get job details" });
  }
});

// PATCH /admin/jobs/:id/status — Moderate job status
router.patch("/jobs/:id/status", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { status } = req.body;

    if (!status || !Object.values(JobStatus).includes(status)) {
      res.status(400).json({ success: false, error: "Invalid job status specified." });
      return;
    }

    const updated = await prisma.job.update({
      where: { id },
      data: { status: status as JobStatus },
      select: { id: true, title: true, status: true },
    });

    await logAuditEvent({
      actorId: req.user!.id,
      action: "JOB_STATUS_CHANGE",
      entityType: "JOB",
      entityId: id,
      metadata: { newStatus: status, title: updated.title },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.status(200).json({
      success: true,
      message: `Job status updated to ${status}`,
      job: updated,
    });
  } catch (error) {
    console.error("Admin update job status error:", error);
    res.status(500).json({ success: false, error: "Failed to update job status" });
  }
});

// DELETE /admin/jobs/:id — Close or delete job
router.delete("/jobs/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    // Check if contracts exist
    const contractsCount = await prisma.contract.count({ where: { jobId: id } });
    if (contractsCount > 0) {
      // Soft close to protect financial integrity
      const updated = await prisma.job.update({
        where: { id },
        data: { status: JobStatus.CLOSED },
        select: { id: true, title: true, status: true },
      });

      await logAuditEvent({
        actorId: req.user!.id,
        action: "JOB_CLOSED",
        entityType: "JOB",
        entityId: id,
        metadata: { reason: "Job has active contracts, closed by admin" },
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      });

      res.status(200).json({
        success: true,
        message: "Job has existing contracts; status changed to CLOSED.",
        job: updated,
      });
      return;
    }

    await prisma.jobSkill.deleteMany({ where: { jobId: id } });
    await prisma.proposal.deleteMany({ where: { jobId: id } });
    const deleted = await prisma.job.delete({
      where: { id },
      select: { id: true, title: true },
    });

    await logAuditEvent({
      actorId: req.user!.id,
      action: "JOB_DELETED",
      entityType: "JOB",
      entityId: id,
      metadata: { title: deleted.title },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.status(200).json({
      success: true,
      message: `Job "${deleted.title}" deleted successfully.`,
    });
  } catch (error) {
    console.error("Admin delete job error:", error);
    res.status(500).json({ success: false, error: "Failed to delete job" });
  }
});

// ==========================================
// PROPOSALS OVERSIGHT
// ==========================================

// GET /admin/proposals — List all proposals across marketplace
router.get("/proposals", async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, search, page = "1", limit = "20" } = req.query;
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const take = Math.min(50, Math.max(1, parseInt(limit as string, 10) || 20));
    const skip = (pageNum - 1) * take;

    const where: any = {};
    if (status) where.status = status as ProposalStatus;
    if (search) {
      const q = (search as string).trim();
      where.OR = [
        { coverLetter: { contains: q, mode: "insensitive" } },
        { job: { title: { contains: q, mode: "insensitive" } } },
        { freelancer: { name: { contains: q, mode: "insensitive" } } },
      ];
    }

    const [total, proposals] = await Promise.all([
      prisma.proposal.count({ where }),
      prisma.proposal.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          freelancer: { select: { id: true, name: true, email: true, avatarUrl: true } },
          job: {
            select: {
              id: true,
              title: true,
              budget: true,
              status: true,
              client: { select: { id: true, name: true, email: true } },
            },
          },
        },
      }),
    ]);

    res.status(200).json({
      success: true,
      data: proposals.map((p) => ({
        id: p.id,
        bidAmount: Number(p.bidAmount),
        estimatedDays: p.estimatedDays,
        coverLetter: p.coverLetter,
        status: p.status,
        freelancer: p.freelancer,
        job: {
          id: p.job.id,
          title: p.job.title,
          budget: Number(p.job.budget),
          status: p.job.status,
          client: p.job.client,
        },
        createdAt: p.createdAt.toISOString(),
      })),
      pagination: { total, page: pageNum, limit: take, totalPages: Math.ceil(total / take) },
    });
  } catch (error) {
    console.error("Admin list proposals error:", error);
    res.status(500).json({ success: false, error: "Failed to list proposals" });
  }
});

// PATCH /admin/proposals/:id/status — Moderate proposal status
router.patch("/proposals/:id/status", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { status } = req.body;

    if (!status || !Object.values(ProposalStatus).includes(status)) {
      res.status(400).json({ success: false, error: "Invalid proposal status." });
      return;
    }

    const updated = await prisma.proposal.update({
      where: { id },
      data: { status: status as ProposalStatus },
      select: { id: true, status: true },
    });

    await logAuditEvent({
      actorId: req.user!.id,
      action: "PROPOSAL_STATUS_CHANGE",
      entityType: "PROPOSAL",
      entityId: id,
      metadata: { newStatus: status },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.status(200).json({
      success: true,
      message: `Proposal status updated to ${status}`,
      proposal: updated,
    });
  } catch (error) {
    console.error("Admin update proposal status error:", error);
    res.status(500).json({ success: false, error: "Failed to update proposal status" });
  }
});

// ==========================================
// CONTRACTS GOVERNANCE
// ==========================================

// GET /admin/contracts — List contracts across marketplace
router.get("/contracts", async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, search, page = "1", limit = "20" } = req.query;
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const take = Math.min(50, Math.max(1, parseInt(limit as string, 10) || 20));
    const skip = (pageNum - 1) * take;

    const where: any = {};
    if (status) where.status = status as ContractStatus;
    if (search) {
      const q = (search as string).trim();
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { contractNumber: { contains: q, mode: "insensitive" } },
        { client: { name: { contains: q, mode: "insensitive" } } },
        { freelancer: { name: { contains: q, mode: "insensitive" } } },
      ];
    }

    const [total, contracts] = await Promise.all([
      prisma.contract.count({ where }),
      prisma.contract.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          client: { select: { id: true, name: true, email: true } },
          freelancer: { select: { id: true, name: true, email: true } },
          _count: { select: { milestones: true } },
        },
      }),
    ]);

    res.status(200).json({
      success: true,
      data: contracts.map((c) => ({
        id: c.id,
        contractNumber: c.contractNumber,
        title: c.title,
        totalAmount: Number(c.totalAmount),
        escrowBalance: Number(c.escrowBalance),
        status: c.status,
        client: c.client,
        freelancer: c.freelancer,
        milestonesCount: c._count.milestones,
        messagesCount: 0,
        createdAt: c.createdAt.toISOString(),
      })),
      pagination: { total, page: pageNum, limit: take, totalPages: Math.ceil(total / take) },
    });
  } catch (error) {
    console.error("Admin list contracts error:", error);
    res.status(500).json({ success: false, error: "Failed to list contracts" });
  }
});

// GET /admin/contracts/:id — Get detailed contract with milestones
router.get("/contracts/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const contract = await prisma.contract.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, name: true, email: true, avatarUrl: true } },
        freelancer: { select: { id: true, name: true, email: true, avatarUrl: true } },
        job: { select: { id: true, title: true, description: true } },
        milestones: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!contract) {
      res.status(404).json({ success: false, error: "Contract not found" });
      return;
    }

    res.status(200).json({
      success: true,
      contract: {
        ...contract,
        totalAmount: Number(contract.totalAmount),
        escrowBalance: Number(contract.escrowBalance),
        milestones: contract.milestones.map((m) => ({
          ...m,
          amount: Number(m.amount),
        })),
      },
    });
  } catch (error) {
    console.error("Admin get contract error:", error);
    res.status(500).json({ success: false, error: "Failed to get contract" });
  }
});

// PATCH /admin/contracts/:id/status — Admin status override
router.patch("/contracts/:id/status", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { status } = req.body;

    if (!status || !Object.values(ContractStatus).includes(status)) {
      res.status(400).json({ success: false, error: "Invalid contract status." });
      return;
    }

    const updated = await prisma.contract.update({
      where: { id },
      data: { status: status as ContractStatus },
      select: { id: true, contractNumber: true, status: true },
    });

    await logAuditEvent({
      actorId: req.user!.id,
      action: "CONTRACT_STATUS_CHANGE",
      entityType: "CONTRACT",
      entityId: id,
      metadata: { newStatus: status, contractNumber: updated.contractNumber },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.status(200).json({
      success: true,
      message: `Contract status changed to ${status}`,
      contract: updated,
    });
  } catch (error) {
    console.error("Admin update contract status error:", error);
    res.status(500).json({ success: false, error: "Failed to update contract status" });
  }
});

// ==========================================
// FINANCIAL TRANSACTIONS LEDGER
// ==========================================

// GET /admin/transactions — Platform ledger with fee breakdown
router.get("/transactions", async (req: Request, res: Response): Promise<void> => {
  try {
    const { type, status, page = "1", limit = "25" } = req.query;
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const take = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 25));
    const skip = (pageNum - 1) * take;

    const where: any = {};
    if (type) where.type = type as TransactionType;
    if (status) where.status = status as TransactionStatus;

    const [total, transactions] = await Promise.all([
      prisma.transaction.count({ where }),
      prisma.transaction.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          client: { select: { id: true, name: true, email: true, role: true } },
          freelancer: { select: { id: true, name: true, email: true, role: true } },
          contract: { select: { id: true, contractNumber: true, title: true } },
        },
      }),
    ]);

    const formatted = transactions.map((t) => {
      const amount = Number(t.amount);
      const fee = t.type === "RELEASE" ? amount * 0.1 : 0;
      const net = amount - fee;

      return {
        id: t.id,
        transactionNumber: t.transactionNumber,
        type: t.type,
        status: t.status,
        amount,
        fee,
        net,
        description: t.reference || `${t.type} transaction`,
        user: t.client || t.freelancer,
        contract: t.contract,
        createdAt: t.createdAt.toISOString(),
      };
    });

    res.status(200).json({
      success: true,
      data: formatted,
      pagination: { total, page: pageNum, limit: take, totalPages: Math.ceil(total / take) },
    });
  } catch (error) {
    console.error("Admin list transactions error:", error);
    res.status(500).json({ success: false, error: "Failed to list transactions" });
  }
});

// ==========================================
// SYSTEM SETTINGS
// ==========================================

let platformSettings = {
  platformFeePercent: 10,
  maintenanceMode: false,
  minJobBudget: 50,
  escrowAutoReleaseDays: 14,
  disputeSlaHours: 48,
  requireEmailVerification: true,
  allowNewRegistrations: true,
};

// GET /admin/settings — Get current platform configuration
router.get("/settings", async (_req: Request, res: Response): Promise<void> => {
  res.status(200).json({
    success: true,
    settings: platformSettings,
  });
});

// PUT /admin/settings — Update platform configuration
router.put("/settings", async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      platformFeePercent,
      maintenanceMode,
      minJobBudget,
      escrowAutoReleaseDays,
      disputeSlaHours,
      requireEmailVerification,
      allowNewRegistrations,
    } = req.body;

    if (platformFeePercent !== undefined) platformSettings.platformFeePercent = Math.max(0, Math.min(100, Number(platformFeePercent)));
    if (maintenanceMode !== undefined) platformSettings.maintenanceMode = Boolean(maintenanceMode);
    if (minJobBudget !== undefined) platformSettings.minJobBudget = Math.max(1, Number(minJobBudget));
    if (escrowAutoReleaseDays !== undefined) platformSettings.escrowAutoReleaseDays = Math.max(1, Number(escrowAutoReleaseDays));
    if (disputeSlaHours !== undefined) platformSettings.disputeSlaHours = Math.max(1, Number(disputeSlaHours));
    if (requireEmailVerification !== undefined) platformSettings.requireEmailVerification = Boolean(requireEmailVerification);
    if (allowNewRegistrations !== undefined) platformSettings.allowNewRegistrations = Boolean(allowNewRegistrations);

    await logAuditEvent({
      actorId: req.user!.id,
      action: "SETTINGS_UPDATED",
      entityType: "SYSTEM",
      entityId: "platform-settings",
      metadata: platformSettings,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.status(200).json({
      success: true,
      message: "Platform settings updated successfully",
      settings: platformSettings,
    });
  } catch (error) {
    console.error("Admin update settings error:", error);
    res.status(500).json({ success: false, error: "Failed to update platform settings" });
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
