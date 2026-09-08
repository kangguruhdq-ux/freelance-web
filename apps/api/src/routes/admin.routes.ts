import { Router, Request, Response } from "express";
import { UserRole } from "@prisma/client";
import prisma from "../lib/prisma";
import { authenticate, requireRole } from "../middleware/auth.middleware";

const router = Router();

// All routes in this router require ADMIN role
router.use(authenticate);
router.use(requireRole(UserRole.ADMIN));

// GET /admin/stats
router.get("/stats", async (_req: Request, res: Response): Promise<void> => {
  try {
    const [totalUsers, totalJobs, totalContracts, openDisputes, pendingReports] = await Promise.all([
      prisma.user.count(),
      prisma.job.count(),
      prisma.contract.count(),
      prisma.dispute.count({ where: { status: "OPEN" } }),
      prisma.report.count({ where: { status: "OPEN" } }),
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalJobs,
        totalContracts,
        openDisputes,
        pendingReports,
      },
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// GET /admin/health
router.get("/health", async (_req: Request, res: Response): Promise<void> => {
  res.status(200).json({
    success: true,
    status: "HEALTHY",
    roleVerified: "ADMIN",
    timestamp: new Date().toISOString(),
  });
});

export default router;
