import { Router, Request, Response } from "express";
import prisma from "../lib/prisma";
import { authenticate } from "../middleware/auth.middleware";
import { MilestoneStatus } from "@prisma/client";

const router = Router();

// POST /milestones — Create milestone on contract (CLIENT only)
router.post("/", authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { contractId, title, description, amount, dueDate } = req.body;

    if (!contractId || !title || !amount) {
      res.status(400).json({ success: false, error: "Contract ID, title, and amount are required." });
      return;
    }

    const contract = await prisma.contract.findUnique({ where: { id: contractId } });
    if (!contract) {
      res.status(404).json({ success: false, error: "Contract not found." });
      return;
    }

    if (contract.clientId !== req.user!.id && req.user!.role !== "ADMIN") {
      res.status(403).json({ success: false, error: "Forbidden: Only the contract client can add milestones." });
      return;
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      res.status(400).json({ success: false, error: "Amount must be a positive number." });
      return;
    }

    const milestone = await prisma.milestone.create({
      data: {
        contractId,
        title: title.trim(),
        description: description ? description.trim() : null,
        amount: numericAmount,
        dueDate: dueDate ? new Date(dueDate) : null,
        status: "PENDING",
      },
    });

    res.status(201).json({
      success: true,
      message: "Milestone added successfully.",
      milestone: {
        id: milestone.id,
        title: milestone.title,
        amount: Number(milestone.amount),
        status: milestone.status,
      },
    });
  } catch (error) {
    console.error("Create milestone error:", error);
    res.status(500).json({ success: false, error: "Failed to create milestone" });
  }
});

// POST /milestones/:id/submit — Freelancer submits milestone deliverable
router.post("/:id/submit", authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const milestone = await prisma.milestone.findUnique({
      where: { id },
      include: { contract: true },
    });

    if (!milestone) {
      res.status(404).json({ success: false, error: "Milestone not found." });
      return;
    }

    // Must be the freelancer on this contract
    if (milestone.contract.freelancerId !== req.user!.id && req.user!.role !== "ADMIN") {
      res.status(403).json({
        success: false,
        error: "Forbidden: Only the assigned freelancer can submit deliverables for this milestone.",
      });
      return;
    }

    const { deliverableNotes, workUrl } = req.body || {};

    const updated = await prisma.milestone.update({
      where: { id },
      data: {
        status: "SUBMITTED",
        submittedAt: new Date(),
        ...(deliverableNotes ? { description: deliverableNotes } : {}),
      },
    });

    // Auto-post deliverable notification to conversation
    try {
      const convParticipant = await prisma.conversationParticipant.findFirst({
        where: { userId: milestone.contract.clientId },
        select: { conversationId: true },
      });
      if (convParticipant) {
        const shared = await prisma.conversationParticipant.findFirst({
          where: {
            conversationId: convParticipant.conversationId,
            userId: milestone.contract.freelancerId,
          },
        });
        if (shared) {
          const noteText = deliverableNotes ? `\n\n📝 Notes: ${deliverableNotes}` : "";
          const urlText = workUrl ? `\n🔗 Link: ${workUrl}` : "";
          await prisma.message.create({
            data: {
              conversationId: shared.conversationId,
              senderId: req.user!.id,
              content: `🚀 Deliverable submitted for "${milestone.title}"!${noteText}${urlText}`,
            },
          });
        }
      }
    } catch (e) {
      console.warn("Could not post deliverable message to conversation:", e);
    }

    res.status(200).json({
      success: true,
      message: "Milestone deliverables submitted for client approval.",
      milestone: {
        id: updated.id,
        status: updated.status,
        submittedAt: updated.submittedAt,
      },
    });
  } catch (error) {
    console.error("Submit milestone error:", error);
    res.status(500).json({ success: false, error: "Failed to submit milestone" });
  }
});

// POST /milestones/:id/approve — Client approves milestone
router.post("/:id/approve", authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const milestone = await prisma.milestone.findUnique({
      where: { id },
      include: { contract: true },
    });

    if (!milestone) {
      res.status(404).json({ success: false, error: "Milestone not found." });
      return;
    }

    // Must be the client on this contract
    if (milestone.contract.clientId !== req.user!.id && req.user!.role !== "ADMIN") {
      res.status(403).json({
        success: false,
        error: "Forbidden: Only the contract client can approve milestones.",
      });
      return;
    }

    const updated = await prisma.milestone.update({
      where: { id },
      data: {
        status: "APPROVED",
        approvedAt: new Date(),
      },
    });

    res.status(200).json({
      success: true,
      message: "Milestone approved successfully.",
      milestone: {
        id: updated.id,
        status: updated.status,
        approvedAt: updated.approvedAt,
      },
    });
  } catch (error) {
    console.error("Approve milestone error:", error);
    res.status(500).json({ success: false, error: "Failed to approve milestone" });
  }
});

// POST /milestones/:id/revision — Client requests revision on milestone
router.post("/:id/revision", authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const milestone = await prisma.milestone.findUnique({
      where: { id },
      include: { contract: true },
    });

    if (!milestone) {
      res.status(404).json({ success: false, error: "Milestone not found." });
      return;
    }

    if (milestone.contract.clientId !== req.user!.id && req.user!.role !== "ADMIN") {
      res.status(403).json({
        success: false,
        error: "Forbidden: Only the contract client can request milestone revisions.",
      });
      return;
    }

    const updated = await prisma.milestone.update({
      where: { id },
      data: {
        status: "IN_PROGRESS",
      },
    });

    res.status(200).json({
      success: true,
      message: "Revision requested. Milestone status returned to IN_PROGRESS.",
      milestone: {
        id: updated.id,
        status: updated.status,
      },
    });
  } catch (error) {
    console.error("Request revision error:", error);
    res.status(500).json({ success: false, error: "Failed to request revision" });
  }
});

export default router;
