import { Router, Request, Response } from "express";
import prisma from "../lib/prisma";
import { authenticate, requireOwnership } from "../middleware/auth.middleware";

const router = Router();

// PUT /users/me/avatar — Update current user's profile photo/avatar
router.put("/me/avatar", authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { avatarUrl } = req.body;

    if (!avatarUrl || typeof avatarUrl !== "string") {
      res.status(400).json({ success: false, error: "avatarUrl is required and must be a string." });
      return;
    }

    const trimmed = avatarUrl.trim();

    // Validate MIME format and protocol
    const isDataUri = /^data:image\/(png|jpe?g|webp|gif);base64,[A-Za-z0-9+/=]+$/i.test(trimmed);
    const isHttpUrl = /^https?:\/\/.+/i.test(trimmed);

    if (!isDataUri && !isHttpUrl) {
      res.status(400).json({
        success: false,
        error: "Invalid image format. Supported formats: JPEG, PNG, WebP, GIF or valid HTTPS image URL.",
      });
      return;
    }

    // Limit base64 image size to ~3.5MB (approx 5M characters)
    if (trimmed.length > 5 * 1024 * 1024) {
      res.status(400).json({
        success: false,
        error: "Image file size exceeds maximum limit of 3MB.",
      });
      return;
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: trimmed },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        avatarUrl: true,
      },
    });

    res.status(200).json({
      success: true,
      message: "Profile photo updated successfully.",
      user: updated,
    });
  } catch (error) {
    console.error("Update avatar error:", error);
    res.status(500).json({ success: false, error: "Failed to update profile photo." });
  }
});

// DELETE /users/me/avatar — Remove current user's profile photo/avatar
router.delete("/me/avatar", authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: null },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        avatarUrl: true,
      },
    });

    res.status(200).json({
      success: true,
      message: "Profile photo removed successfully.",
      user: updated,
    });
  } catch (error) {
    console.error("Remove avatar error:", error);
    res.status(500).json({ success: false, error: "Failed to remove profile photo." });
  }
});

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
            availability: true,
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

