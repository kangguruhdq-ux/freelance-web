import { Router, Request, Response } from "express";
import prisma from "../lib/prisma";
import { authenticate, requireRole } from "../middleware/auth.middleware";
import { TransactionType, TransactionStatus } from "@prisma/client";
import { createNotification } from "./notifications.routes";

const router = Router();
const PLATFORM_FEE_PERCENTAGE = 0.10; // 10% platform fee

// POST /payments/milestones/:id/fund — Client funds milestone into escrow
router.post("/milestones/:id/fund", authenticate, requireRole("CLIENT"), async (req: Request, res: Response): Promise<void> => {
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

    // Authorization: Must be client of the contract
    if (milestone.contract.clientId !== req.user!.id && req.user!.role !== "ADMIN") {
      res.status(403).json({
        success: false,
        error: "Forbidden: You cannot fund a milestone on another client's project.",
      });
      return;
    }

    if (milestone.status === "APPROVED") {
      res.status(400).json({ success: false, error: "Milestone has already been approved and funded." });
      return;
    }

    const milestoneAmount = Number(milestone.amount);
    const txNumber = `TX-HOLD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create ESCROW_HOLD transaction
      const transaction = await tx.transaction.create({
        data: {
          transactionNumber: txNumber,
          clientId: milestone.contract.clientId,
          freelancerId: milestone.contract.freelancerId,
          contractId: milestone.contractId,
          milestoneId: milestone.id,
          amount: milestoneAmount,
          type: "ESCROW_HOLD",
          status: "COMPLETED",
          reference: "Escrow collateral secured",
        },
      });

      // 2. Increment contract escrow balance
      const updatedContract = await tx.contract.update({
        where: { id: milestone.contractId },
        data: {
          escrowBalance: { increment: milestoneAmount },
        },
      });

      // 3. Update milestone status to IN_PROGRESS
      const updatedMilestone = await tx.milestone.update({
        where: { id: milestone.id },
        data: { status: "IN_PROGRESS" },
      });

      return { transaction, updatedContract, updatedMilestone };
    });

    // Notify freelancer that milestone is funded
    await createNotification({
      userId: milestone.contract.freelancerId,
      type: "SYSTEM_ALERT",
      title: `Milestone funded: ${milestone.title}`,
      message: `${req.user!.name} funded $${milestoneAmount.toLocaleString()} into secure escrow. You may begin work.`,
      linkUrl: `/contracts/${milestone.contractId}`,
      metadata: { contractId: milestone.contractId, milestoneId: milestone.id },
    });

    res.status(200).json({
      success: true,
      message: `Milestone funded. $${milestoneAmount} held securely in escrow.`,
      transaction: {
        id: result.transaction.id,
        transactionNumber: result.transaction.transactionNumber,
        amount: Number(result.transaction.amount),
        type: result.transaction.type,
        status: result.transaction.status,
      },
      escrowBalance: Number(result.updatedContract.escrowBalance),
    });
  } catch (error: any) {
    console.error("Fund milestone error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to fund milestone" });
  }
});

// POST /payments/milestones/:id/release — Client releases escrow payment to freelancer
router.post("/milestones/:id/release", authenticate, requireRole("CLIENT"), async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const milestone = await prisma.milestone.findUnique({
      where: { id },
      include: {
        contract: {
          include: {
            milestones: true,
          },
        },
      },
    });

    if (!milestone) {
      res.status(404).json({ success: false, error: "Milestone not found." });
      return;
    }

    // Authorization: Must be client of the contract
    if (milestone.contract.clientId !== req.user!.id && req.user!.role !== "ADMIN") {
      res.status(403).json({
        success: false,
        error: "Forbidden: You cannot release payments for another client's project.",
      });
      return;
    }

    const grossAmount = Number(milestone.amount);
    const currentEscrow = Number(milestone.contract.escrowBalance);

    // If escrow hasn't been held yet, release allows funding + releasing simultaneously
    const effectiveEscrow = Math.max(currentEscrow, grossAmount);

    // Platform fee calculation (Backend source of truth)
    const platformFee = Math.round(grossAmount * PLATFORM_FEE_PERCENTAGE * 100) / 100;
    const netFreelancerAmount = Math.round((grossAmount - platformFee) * 100) / 100;

    const releaseTxNumber = `TX-REL-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const feeTxNumber = `TX-FEE-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Record release transaction to freelancer
      const releaseTx = await tx.transaction.create({
        data: {
          transactionNumber: releaseTxNumber,
          clientId: milestone.contract.clientId,
          freelancerId: milestone.contract.freelancerId,
          contractId: milestone.contractId,
          milestoneId: milestone.id,
          amount: netFreelancerAmount,
          type: "RELEASE",
          status: "COMPLETED",
          reference: `Milestone release (${100 - PLATFORM_FEE_PERCENTAGE * 100}% net)`,
        },
      });

      // 2. Record platform fee transaction
      const feeTx = await tx.transaction.create({
        data: {
          transactionNumber: feeTxNumber,
          clientId: milestone.contract.clientId,
          freelancerId: milestone.contract.freelancerId,
          contractId: milestone.contractId,
          milestoneId: milestone.id,
          amount: platformFee,
          type: "PLATFORM_FEE",
          status: "COMPLETED",
          reference: `Platform fee (${PLATFORM_FEE_PERCENTAGE * 100}%)`,
        },
      });

      // 3. Decrement contract escrow balance
      const newEscrowBalance = Math.max(0, currentEscrow - grossAmount);
      const updatedContract = await tx.contract.update({
        where: { id: milestone.contractId },
        data: {
          escrowBalance: newEscrowBalance,
        },
      });

      // 4. Update milestone status to APPROVED
      const updatedMilestone = await tx.milestone.update({
        where: { id: milestone.id },
        data: {
          status: "APPROVED",
          approvedAt: new Date(),
        },
      });

      // 5. Update freelancer profile total earnings
      await tx.profile.updateMany({
        where: { userId: milestone.contract.freelancerId },
        data: {
          totalEarnings: { increment: netFreelancerAmount },
          completedJobs: { increment: 1 },
        },
      });

      // 6. Check if all milestones are approved; if so, mark contract COMPLETED
      const allMilestones = milestone.contract.milestones;
      const otherApproved = allMilestones
        .filter((m) => m.id !== milestone.id)
        .every((m) => m.status === "APPROVED");

      if (otherApproved) {
        await tx.contract.update({
          where: { id: milestone.contractId },
          data: { status: "COMPLETED", completedAt: new Date() },
        });
      }

      return { releaseTx, feeTx, updatedContract, updatedMilestone };
    });

    // Notify freelancer of released payment
    await createNotification({
      userId: milestone.contract.freelancerId,
      type: "PAYMENT_RELEASED",
      title: "Escrow Payment Released!",
      message: `${req.user!.name} released $${netFreelancerAmount.toLocaleString()} to your balance for "${milestone.title}".`,
      linkUrl: `/contracts/${milestone.contractId}`,
      metadata: { contractId: milestone.contractId, milestoneId: milestone.id },
    });

    res.status(200).json({
      success: true,
      message: "Payment successfully released from escrow.",
      breakdown: {
        grossAmount,
        platformFee,
        netFreelancerAmount,
        escrowRemaining: Number(result.updatedContract.escrowBalance),
      },
    });
  } catch (error: any) {
    console.error("Release payment error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to release payment" });
  }
});

// GET /payments/transactions — User's transaction ledger
router.get("/transactions", authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const role = req.user!.role;

    const where =
      role === "ADMIN"
        ? {}
        : {
            OR: [{ clientId: userId }, { freelancerId: userId }],
          };

    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        client: { select: { id: true, name: true } },
        freelancer: { select: { id: true, name: true } },
        contract: { select: { id: true, title: true, contractNumber: true } },
      },
    });

    const formatted = transactions.map((tx) => ({
      id: tx.id,
      transactionNumber: tx.transactionNumber,
      amount: Number(tx.amount),
      type: tx.type,
      status: tx.status,
      reference: tx.reference,
      createdAt: tx.createdAt.toISOString(),
      clientName: tx.client.name,
      freelancerName: tx.freelancer.name,
      contractTitle: tx.contract?.title || "N/A",
    }));

    res.status(200).json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    console.error("List transactions error:", error);
    res.status(500).json({ success: false, error: "Failed to load transactions" });
  }
});

export default router;
