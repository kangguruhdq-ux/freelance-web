import { Router, Request, Response } from "express";
import prisma from "../lib/prisma";
import { authenticate, requireOwnership } from "../middleware/auth.middleware";

const router = Router();

// GET /users/:id (protected by authentication & resource ownership check)
router.get("/:id", authenticate, requireOwnership("id"), async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        avatarUrl: true,
        createdAt: true,
        profile: {
          select: {
            headline: true,
            bio: true,
            location: true,
            hourlyRate: true,
            rating: true,
            completedJobs: true,
          },
        },
      },
    });

    if (!user) {
      res.status(404).json({ success: false, error: "User not found" });
      return;
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error("User fetch error:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

export default router;
