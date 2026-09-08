import { Router, Request, Response } from "express";
import { ReportTargetType } from "@prisma/client";
import prisma from "../lib/prisma";
import { authenticate } from "../middleware/auth.middleware";
import { logAuditEvent } from "../lib/audit";

const router = Router();

// POST /reports — Submit moderation report
router.post("/", authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { targetType, targetId, reason, description } = req.body;

    if (!targetType || !Object.values(ReportTargetType).includes(targetType)) {
      res.status(400).json({ success: false, error: "Invalid report target type." });
      return;
    }

    if (!targetId || !reason || !description || typeof description !== "string" || description.trim().length < 10) {
      res.status(400).json({
        success: false,
        error: "Target ID, reason, and description (min 10 chars) are required.",
      });
      return;
    }

    const report = await prisma.report.create({
      data: {
        reporterId: req.user!.id,
        targetType: targetType as ReportTargetType,
        targetId,
        reason: reason.trim(),
        description: description.trim(),
        status: "OPEN",
      },
    });

    await logAuditEvent({
      actorId: req.user!.id,
      action: "REPORT_FILED",
      entityType: "REPORT",
      entityId: report.id,
      metadata: { targetType, targetId, reason },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.status(201).json({
      success: true,
      message: "Report submitted to moderation queue.",
      report: {
        id: report.id,
        targetType: report.targetType,
        status: report.status,
      },
    });
  } catch (error: any) {
    console.error("Submit report error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to submit report" });
  }
});

export default router;
