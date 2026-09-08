import { Router, Request, Response } from "express";
import prisma from "../lib/prisma";
import { authenticate, requireRole } from "../middleware/auth.middleware";
import { ContractStatus } from "@prisma/client";

const router = Router();

// POST /contracts — Client accepts proposal and creates contract
router.post("/", authenticate, requireRole("CLIENT"), async (req: Request, res: Response): Promise<void> => {
  try {
    const { proposalId, title, terms, startDate, endDate } = req.body;

    if (!proposalId) {
      res.status(400).json({ success: false, error: "Proposal ID is required." });
      return;
    }

    // Verify proposal exists and user is client of the job
    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
      include: {
        job: true,
        freelancer: true,
      },
    });

    if (!proposal) {
      res.status(404).json({ success: false, error: "Proposal not found." });
      return;
    }

    if (proposal.job.clientId !== req.user!.id) {
      res.status(403).json({
        success: false,
        error: "Forbidden: You can only create contracts for proposals submitted to your own jobs.",
      });
      return;
    }

    // Check if contract already exists for this proposal
    const existingContract = await prisma.contract.findUnique({
      where: { proposalId },
    });

    if (existingContract) {
      res.status(409).json({
        success: false,
        error: "A contract has already been established for this proposal.",
      });
      return;
    }

    const contractNumber = `CNT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const contractTitle = title || proposal.job.title;

    // Run in a transaction: create contract, set proposal to ACCEPTED, update job status, create initial milestone
    const result = await prisma.$transaction(async (tx) => {
      const contract = await tx.contract.create({
        data: {
          contractNumber,
          title: contractTitle,
          jobId: proposal.jobId,
          proposalId: proposal.id,
          clientId: req.user!.id,
          freelancerId: proposal.freelancerId,
          totalAmount: proposal.bidAmount,
          escrowBalance: 0,
          status: "ACTIVE",
          startDate: startDate ? new Date(startDate) : new Date(),
          endDate: endDate ? new Date(endDate) : null,
        },
      });

      // Update proposal status
      await tx.proposal.update({
        where: { id: proposalId },
        data: { status: "ACCEPTED" },
      });

      // Update job status to IN_PROGRESS
      await tx.job.update({
        where: { id: proposal.jobId },
        data: { status: "IN_PROGRESS" },
      });

      // Create initial milestone
      const milestone = await tx.milestone.create({
        data: {
          contractId: contract.id,
          title: "Initial Milestone Deliverable",
          description: "Project setup, environment configuration, and initial architectural implementation.",
          amount: proposal.bidAmount,
          status: "PENDING",
          orderIndex: 1,
        },
      });

      // Setup conversation between client and freelancer for this workspace
      const conversation = await tx.conversation.create({
        data: {
          participants: {
            create: [
              { userId: req.user!.id },
              { userId: proposal.freelancerId },
            ],
          },
        },
      });

      // Seed initial welcome message
      await tx.message.create({
        data: {
          conversationId: conversation.id,
          senderId: req.user!.id,
          content: `Welcome! Contract #${contractNumber} has been activated. Let's build something great together.`,
        },
      });

      return { contract, milestone };
    });

    res.status(201).json({
      success: true,
      message: "Contract created and project workspace initialized.",
      contract: {
        id: result.contract.id,
        contractNumber: result.contract.contractNumber,
        title: result.contract.title,
        totalAmount: Number(result.contract.totalAmount),
        status: result.contract.status,
      },
    });
  } catch (error: any) {
    console.error("Create contract error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to create contract" });
  }
});

// GET /contracts — List user's contracts
router.get("/", authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const role = req.user!.role;

    const where =
      role === "ADMIN"
        ? {}
        : {
            OR: [{ clientId: userId }, { freelancerId: userId }],
          };

    const contracts = await prisma.contract.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        client: { select: { id: true, name: true, avatarUrl: true } },
        freelancer: { select: { id: true, name: true, avatarUrl: true } },
        milestones: { select: { id: true, title: true, amount: true, status: true } },
        job: { select: { id: true, title: true, category: { select: { name: true } } } },
      },
    });

    const formatted = contracts.map((c) => ({
      id: c.id,
      contractNumber: c.contractNumber,
      title: c.title,
      totalAmount: Number(c.totalAmount),
      escrowBalance: Number(c.escrowBalance),
      status: c.status,
      startDate: c.startDate.toISOString(),
      endDate: c.endDate ? c.endDate.toISOString() : null,
      client: c.client,
      freelancer: c.freelancer,
      job: {
        id: c.job.id,
        title: c.job.title,
        category: c.job.category.name,
      },
      milestonesCount: c.milestones.length,
    }));

    res.status(200).json({
      success: true,
      data: formatted,
      contracts: formatted,
    });
  } catch (error) {
    console.error("List contracts error:", error);
    res.status(500).json({ success: false, error: "Failed to list contracts" });
  }
});

// GET /contracts/:id — Detailed project workspace (Participant or Admin only)
router.get("/:id", authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const contract = await prisma.contract.findUnique({
      where: { id },
      include: {
        client: {
          select: { id: true, name: true, email: true, avatarUrl: true, createdAt: true },
        },
        freelancer: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            profile: { select: { headline: true, rating: true } },
          },
        },
        milestones: {
          orderBy: { orderIndex: "asc" },
        },
        job: {
          select: { id: true, title: true, description: true, category: true },
        },
      },
    });

    if (!contract) {
      res.status(404).json({ success: false, error: "Contract not found" });
      return;
    }

    // Participant verification
    const userId = req.user!.id;
    const isParticipant =
      contract.clientId === userId || contract.freelancerId === userId || req.user!.role === "ADMIN";

    if (!isParticipant) {
      res.status(403).json({
        success: false,
        error: "Forbidden: You are not an authorized participant in this project workspace.",
      });
      return;
    }

    // Ensure contract has at least one milestone
    if (contract.milestones.length === 0) {
      const defaultMilestone = await prisma.milestone.create({
        data: {
          contractId: contract.id,
          title: "Full Project Scope & Final Deliverables",
          description: "Execution and completion of all deliverables agreed upon in project specification.",
          amount: contract.totalAmount,
          status: "PENDING",
          orderIndex: 1,
        },
      });
      contract.milestones = [defaultMilestone];
    }

    res.status(200).json({
      success: true,
      contract: {
        id: contract.id,
        contractNumber: contract.contractNumber,
        title: contract.title,
        totalAmount: Number(contract.totalAmount),
        escrowBalance: Number(contract.escrowBalance),
        status: contract.status,
        startDate: contract.startDate.toISOString(),
        endDate: contract.endDate ? contract.endDate.toISOString() : null,
        client: contract.client,
        freelancer: contract.freelancer,
        job: contract.job,
        milestones: contract.milestones.map((m) => ({
          id: m.id,
          title: m.title,
          description: m.description,
          amount: Number(m.amount),
          status: m.status,
          dueDate: m.dueDate ? m.dueDate.toISOString() : null,
          submittedAt: m.submittedAt ? m.submittedAt.toISOString() : null,
          approvedAt: m.approvedAt ? m.approvedAt.toISOString() : null,
        })),
      },
    });
  } catch (error) {
    console.error("Get contract workspace error:", error);
    res.status(500).json({ success: false, error: "Failed to load project workspace" });
  }
});

// PATCH /contracts/:id/status — Update contract status (e.g. COMPLETED / CANCELLED)
router.patch("/:id/status", authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { status } = req.body;

    if (!status || !Object.values(ContractStatus).includes(status)) {
      res.status(400).json({ success: false, error: "Invalid contract status" });
      return;
    }

    const contract = await prisma.contract.findUnique({ where: { id } });
    if (!contract) {
      res.status(404).json({ success: false, error: "Contract not found" });
      return;
    }

    const userId = req.user!.id;
    const isParticipant =
      contract.clientId === userId || contract.freelancerId === userId || req.user!.role === "ADMIN";

    if (!isParticipant) {
      res.status(403).json({ success: false, error: "Forbidden: Not an authorized participant." });
      return;
    }

    const updated = await prisma.contract.update({
      where: { id },
      data: {
        status: status as ContractStatus,
        completedAt: status === "COMPLETED" ? new Date() : undefined,
      },
    });

    res.status(200).json({
      success: true,
      message: `Contract status updated to ${status}`,
      status: updated.status,
    });
  } catch (error) {
    console.error("Update contract status error:", error);
    res.status(500).json({ success: false, error: "Failed to update contract status" });
  }
});

export default router;
