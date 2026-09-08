import { Router, Request, Response } from "express";
import prisma from "../lib/prisma";
import { authenticate } from "../middleware/auth.middleware";
import { logAuditEvent } from "../lib/audit";

const router = Router();

// POST /contracts/:id/dispute — Participant opens dispute
router.post("/contracts/:id/dispute", authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const contractId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { reason, description } = req.body;

    if (!reason || !description || typeof description !== "string" || description.trim().length < 15) {
      res.status(400).json({
        success: false,
        error: "Reason and a detailed description (min 15 chars) are required to open a dispute.",
      });
      return;
    }

    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
    });

    if (!contract) {
      res.status(404).json({ success: false, error: "Contract not found." });
      return;
    }

    // Participant verification
    const userId = req.user!.id;
    const isParticipant = contract.clientId === userId || contract.freelancerId === userId || req.user!.role === "ADMIN";

    if (!isParticipant) {
      res.status(403).json({
        success: false,
        error: "Forbidden: You are not authorized to open a dispute for this contract.",
      });
      return;
    }

    const existing = await prisma.dispute.findUnique({ where: { contractId } });
    if (existing) {
      res.status(409).json({
        success: false,
        error: "A dispute is already active or recorded for this contract.",
      });
      return;
    }

    const result = await prisma.$transaction(async (tx) => {
      const dispute = await tx.dispute.create({
        data: {
          contractId,
          openedById: userId,
          reason: reason.trim(),
          description: description.trim(),
          status: "OPEN",
        },
      });

      await tx.contract.update({
        where: { id: contractId },
        data: { status: "DISPUTED" },
      });

      return dispute;
    });

    await logAuditEvent({
      actorId: userId,
      action: "DISPUTE_OPENED",
      entityType: "DISPUTE",
      entityId: result.id,
      metadata: { contractId, reason },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.status(201).json({
      success: true,
      message: "Dispute opened successfully. A platform mediator has been notified.",
      dispute: result,
    });
  } catch (error: any) {
    console.error("Open dispute error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to open dispute" });
  }
});

// GET /contracts/:id/dispute — View contract dispute
router.get("/contracts/:id/dispute", authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const contractId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const contract = await prisma.contract.findUnique({ where: { id: contractId } });
    if (!contract) {
      res.status(404).json({ success: false, error: "Contract not found." });
      return;
    }

    const userId = req.user!.id;
    const isParticipant = contract.clientId === userId || contract.freelancerId === userId || req.user!.role === "ADMIN";

    if (!isParticipant) {
      res.status(403).json({
        success: false,
        error: "Forbidden: You are not authorized to view this dispute.",
      });
      return;
    }

    const dispute = await prisma.dispute.findUnique({
      where: { contractId },
      include: {
        openedBy: { select: { id: true, name: true, email: true } },
        resolvedBy: { select: { id: true, name: true } },
      },
    });

    res.status(200).json({
      success: true,
      dispute,
    });
  } catch (error) {
    console.error("Get dispute error:", error);
    res.status(500).json({ success: false, error: "Failed to load dispute" });
  }
});

export default router;
