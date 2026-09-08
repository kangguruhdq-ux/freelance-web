import { Router, Request, Response } from "express";
import prisma from "../lib/prisma";
import { authenticate, requireRole } from "../middleware/auth.middleware";
import { ProposalStatus } from "@prisma/client";
import { createNotification } from "./notifications.routes";

const router = Router();

// POST /proposals — Submit proposal (FREELANCER only)
router.post("/", authenticate, requireRole("FREELANCER"), async (req: Request, res: Response): Promise<void> => {
  try {
    const { jobId, coverLetter, bidAmount, estimatedDays, attachments } = req.body;

    if (!jobId) {
      res.status(400).json({ success: false, error: "Job ID is required." });
      return;
    }

    if (!coverLetter || typeof coverLetter !== "string" || coverLetter.trim().length < 20) {
      res.status(400).json({ success: false, error: "Cover letter must be at least 20 characters." });
      return;
    }

    const numericBid = parseFloat(bidAmount);
    if (isNaN(numericBid) || numericBid <= 0) {
      res.status(400).json({ success: false, error: "Bid amount must be a positive number." });
      return;
    }

    const days = parseInt(estimatedDays, 10);
    if (isNaN(days) || days <= 0) {
      res.status(400).json({ success: false, error: "Estimated duration in days must be at least 1." });
      return;
    }

    const freelancerId = req.user!.id;

    // Verify job exists and is OPEN
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) {
      res.status(404).json({ success: false, error: "Job not found." });
      return;
    }

    if (job.status !== "OPEN") {
      res.status(400).json({ success: false, error: "This job is not currently accepting proposals." });
      return;
    }

    // Check duplicate proposal
    const existing = await prisma.proposal.findUnique({
      where: {
        jobId_freelancerId: {
          jobId,
          freelancerId,
        },
      },
    });

    if (existing) {
      res.status(409).json({
        success: false,
        error: "You have already submitted a proposal for this job. Duplicate proposals are forbidden.",
      });
      return;
    }

    // Transaction to create proposal and increment job proposal count
    const [proposal] = await prisma.$transaction([
      prisma.proposal.create({
        data: {
          jobId,
          freelancerId,
          coverLetter: coverLetter.trim(),
          bidAmount: numericBid,
          estimatedDays: days,
          status: "PENDING",
          ...(Array.isArray(attachments) && attachments.length > 0
            ? {
                attachments: {
                  create: attachments.map((att: any) => ({
                    fileName: String(att.fileName || "attachment"),
                    fileUrl: String(att.fileUrl || ""),
                    mimeType: String(att.mimeType || "application/octet-stream"),
                    sizeBytes: Number(att.sizeBytes || 0),
                    uploaderId: freelancerId,
                  })),
                },
              }
            : {}),
        },
        include: {
          attachments: true,
        },
      }),
      prisma.job.update({
        where: { id: jobId },
        data: { proposalsCount: { increment: 1 } },
      }),
    ]);

    // Dispatch notification to client
    await createNotification({
      userId: job.clientId,
      type: "PROPOSAL_RECEIVED",
      title: "New Proposal Received",
      message: `${req.user!.name} submitted a bid of $${numericBid.toLocaleString()} for "${job.title}"`,
      linkUrl: `/jobs/${jobId}`,
      metadata: { jobId, proposalId: proposal.id, freelancerId },
    });

    res.status(201).json({
      success: true,
      message: "Proposal submitted successfully.",
      proposal: {
        id: proposal.id,
        jobId: proposal.jobId,
        bidAmount: Number(proposal.bidAmount),
        estimatedDays: proposal.estimatedDays,
        status: proposal.status,
        attachments: proposal.attachments || [],
      },
    });
  } catch (error: any) {
    console.error("Submit proposal error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to submit proposal" });
  }
});

// GET /proposals/me — Freelancer's submitted proposals
router.get("/me", authenticate, requireRole("FREELANCER"), async (req: Request, res: Response): Promise<void> => {
  try {
    const freelancerId = req.user!.id;

    const proposals = await prisma.proposal.findMany({
      where: { freelancerId },
      orderBy: { createdAt: "desc" },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            budget: true,
            budgetType: true,
            status: true,
            client: { select: { id: true, name: true } },
          },
        },
        attachments: true,
      },
    });

    const formatted = proposals.map((p) => ({
      id: p.id,
      jobId: p.jobId,
      jobTitle: p.job.title,
      jobBudget: Number(p.job.budget),
      jobStatus: p.job.status,
      clientName: p.job.client.name,
      bidAmount: Number(p.bidAmount),
      estimatedDays: p.estimatedDays,
      coverLetter: p.coverLetter,
      status: p.status,
      createdAt: p.createdAt.toISOString(),
      job: {
        id: p.job.id,
        title: p.job.title,
        budget: Number(p.job.budget),
        status: p.job.status,
        client: p.job.client,
      },
      attachments: p.attachments.map((a) => ({
        id: a.id,
        fileName: a.fileName,
        fileUrl: a.fileUrl,
        mimeType: a.mimeType,
        sizeBytes: a.sizeBytes,
      })),
    }));

    res.status(200).json({
      success: true,
      data: formatted,
      proposals: formatted,
    });
  } catch (error) {
    console.error("Fetch my proposals error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch proposals" });
  }
});

// GET /proposals/:id — Single proposal detail (Authorized participant only)
router.get("/:id", authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const proposal = await prisma.proposal.findUnique({
      where: { id },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            clientId: true,
            budget: true,
          },
        },
        freelancer: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        attachments: true,
      },
    });

    if (!proposal) {
      res.status(404).json({ success: false, error: "Proposal not found" });
      return;
    }

    // Security check: Must be the freelancer who proposed, the client of the job, or an admin
    const userId = req.user!.id;
    const isOwner = proposal.freelancerId === userId;
    const isClient = proposal.job.clientId === userId;
    const isAdmin = req.user!.role === "ADMIN";

    if (!isOwner && !isClient && !isAdmin) {
      res.status(403).json({ success: false, error: "Access denied to this proposal" });
      return;
    }

    res.status(200).json({
      success: true,
      proposal: {
        id: proposal.id,
        jobId: proposal.jobId,
        jobTitle: proposal.job.title,
        coverLetter: proposal.coverLetter,
        bidAmount: Number(proposal.bidAmount),
        estimatedDays: proposal.estimatedDays,
        status: proposal.status,
        freelancer: proposal.freelancer,
        createdAt: proposal.createdAt.toISOString(),
        attachments: proposal.attachments.map((a) => ({
          id: a.id,
          fileName: a.fileName,
          fileUrl: a.fileUrl,
          mimeType: a.mimeType,
          sizeBytes: a.sizeBytes,
        })),
      },
    });
  } catch (error) {
    console.error("Get proposal error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch proposal" });
  }
});

// PUT /proposals/:id — Freelancer edit own proposal
router.put("/:id", authenticate, requireRole("FREELANCER"), async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const proposal = await prisma.proposal.findUnique({ where: { id } });

    if (!proposal) {
      res.status(404).json({ success: false, error: "Proposal not found" });
      return;
    }

    // Ownership check: must belong to logged-in freelancer
    if (proposal.freelancerId !== req.user!.id) {
      res.status(403).json({
        success: false,
        error: "Forbidden: You cannot modify another freelancer's proposal.",
      });
      return;
    }

    // Must be PENDING
    if (proposal.status !== "PENDING") {
      res.status(400).json({
        success: false,
        error: "Only pending proposals can be modified.",
      });
      return;
    }

    const { coverLetter, bidAmount, estimatedDays } = req.body;
    const updateData: any = {};

    if (coverLetter) {
      if (typeof coverLetter !== "string" || coverLetter.trim().length < 20) {
        res.status(400).json({ success: false, error: "Cover letter must be at least 20 characters." });
        return;
      }
      updateData.coverLetter = coverLetter.trim();
    }

    if (bidAmount !== undefined) {
      const num = parseFloat(bidAmount);
      if (isNaN(num) || num <= 0) {
        res.status(400).json({ success: false, error: "Bid amount must be a positive number." });
        return;
      }
      updateData.bidAmount = num;
    }

    if (estimatedDays !== undefined) {
      const days = parseInt(estimatedDays, 10);
      if (isNaN(days) || days <= 0) {
        res.status(400).json({ success: false, error: "Estimated days must be at least 1." });
        return;
      }
      updateData.estimatedDays = days;
    }

    const updated = await prisma.proposal.update({
      where: { id },
      data: updateData,
    });

    res.status(200).json({
      success: true,
      message: "Proposal updated successfully",
      proposal: {
        id: updated.id,
        bidAmount: Number(updated.bidAmount),
        estimatedDays: updated.estimatedDays,
        coverLetter: updated.coverLetter,
      },
    });
  } catch (error) {
    console.error("Update proposal error:", error);
    res.status(500).json({ success: false, error: "Failed to update proposal" });
  }
});

// POST /proposals/:id/withdraw — Freelancer withdraw own proposal
router.post("/:id/withdraw", authenticate, requireRole("FREELANCER"), async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const proposal = await prisma.proposal.findUnique({ where: { id } });

    if (!proposal) {
      res.status(404).json({ success: false, error: "Proposal not found" });
      return;
    }

    if (proposal.freelancerId !== req.user!.id) {
      res.status(403).json({ success: false, error: "Forbidden: You cannot withdraw another freelancer's proposal." });
      return;
    }

    if (proposal.status === "ACCEPTED") {
      res.status(400).json({ success: false, error: "Cannot withdraw an accepted proposal with an active contract." });
      return;
    }

    const updated = await prisma.proposal.update({
      where: { id },
      data: { status: "WITHDRAWN" },
    });

    // Decrement proposalsCount on job if positive
    await prisma.job.update({
      where: { id: proposal.jobId },
      data: { proposalsCount: { decrement: 1 } },
    }).catch(() => {}); // Gracefully ignore if count mismatch

    res.status(200).json({
      success: true,
      message: "Proposal withdrawn successfully",
      status: updated.status,
    });
  } catch (error) {
    console.error("Withdraw proposal error:", error);
    res.status(500).json({ success: false, error: "Failed to withdraw proposal" });
  }
});

export default router;
