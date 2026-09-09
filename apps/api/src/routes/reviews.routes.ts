import { Router, Request, Response } from "express";
import prisma from "../lib/prisma";
import { authenticate } from "../middleware/auth.middleware";
import { createNotification } from "./notifications.routes";
import { encodeDbText, decodeDbText } from "../lib/db-safe";

const router = Router();

// POST /contracts/:id/reviews — Submit review for completed contract
router.post("/contracts/:id/reviews", authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const contractId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { rating, comment } = req.body;

    // Validate rating
    const numRating = parseInt(rating, 10);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      res.status(400).json({ success: false, error: "Rating must be an integer between 1 and 5." });
      return;
    }

    // Validate comment
    if (!comment || typeof comment !== "string" || comment.trim().length < 1) {
      res.status(400).json({ success: false, error: "Please enter a review comment." });
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
    const isClient = contract.clientId === userId;
    const isFreelancer = contract.freelancerId === userId;

    if (!isClient && !isFreelancer && req.user!.role !== "ADMIN") {
      res.status(403).json({
        success: false,
        error: "Forbidden: Only participants in this contract can submit a review.",
      });
      return;
    }

    // Contract must be COMPLETED
    if (contract.status !== "COMPLETED") {
      res.status(400).json({
        success: false,
        error: "Reviews are only permitted once a contract has reached COMPLETED status.",
      });
      return;
    }

    // Determine target reviewee
    const revieweeId = isClient ? contract.freelancerId : contract.clientId;

    // Check duplicate review
    const existing = await prisma.review.findUnique({
      where: {
        contractId_reviewerId: {
          contractId,
          reviewerId: userId,
        },
      },
    });

    if (existing) {
      res.status(409).json({
        success: false,
        error: "You have already submitted a review for this contract.",
      });
      return;
    }

    // Create review and recompute reviewee profile rating
    const review = await prisma.$transaction(async (tx) => {
      const newReview = await tx.review.create({
        data: {
          contractId,
          reviewerId: userId,
          revieweeId,
          rating: numRating,
          comment: encodeDbText(comment.trim()),
        },
      });

      // Recalculate reviewee average rating
      const allReviews = await tx.review.findMany({
        where: { revieweeId },
        select: { rating: true },
      });

      const totalScore = allReviews.reduce((sum, r) => sum + r.rating, 0);
      const avgRating = totalScore / allReviews.length;

      await tx.profile.updateMany({
        where: { userId: revieweeId },
        data: {
          rating: avgRating,
          reviewCount: allReviews.length,
        },
      });

      return newReview;
    });

    // Notify reviewee
    await createNotification({
      userId: revieweeId,
      type: "REVIEW_RECEIVED",
      title: "New Review Received",
      message: encodeDbText(`${req.user!.name} left a ${numRating}-star review: "${comment.trim().substring(0, 70)}"`),
      linkUrl: `/contracts/${contractId}`,
      metadata: { contractId, reviewerId: userId },
    });

    res.status(201).json({
      success: true,
      message: "Review submitted successfully.",
      review: {
        id: review.id,
        rating: review.rating,
        comment: decodeDbText(review.comment),
        createdAt: review.createdAt.toISOString(),
      },
    });
  } catch (error: any) {
    console.error("Submit review error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to submit review" });
  }
});

// GET /contracts/:id/reviews — Reviews for a contract
router.get("/contracts/:id/reviews", authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const contractId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const reviews = await prisma.review.findMany({
      where: { contractId },
      include: {
        reviewer: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    res.status(200).json({
      success: true,
      data: reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: decodeDbText(r.comment),
        reviewerId: r.reviewerId,
        revieweeId: r.revieweeId,
        reviewer: r.reviewer,
        createdAt: r.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Fetch contract reviews error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch reviews" });
  }
});

export default router;
