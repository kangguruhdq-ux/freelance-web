import { Router, Request, Response } from "express";
import { NotificationType } from "@prisma/client";
import prisma from "../lib/prisma";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

/**
 * System helper to dispatch an in-app notification to any user.
 */
export async function createNotification(params: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  linkUrl?: string;
  metadata?: Record<string, any>;
}) {
  try {
    return await prisma.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        linkUrl: params.linkUrl || null,
        metadata: params.metadata || undefined,
      },
    });
  } catch (err) {
    console.error("Failed to dispatch notification:", err);
    return null;
  }
}

// GET /notifications — List notifications for current user with unread counter
router.get("/", authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string, 10) || 20));

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      prisma.notification.count({
        where: { userId, isRead: false },
      }),
    ]);

    res.status(200).json({
      success: true,
      data: notifications,
      unreadCount,
    });
  } catch (error) {
    console.error("Fetch notifications error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch notifications." });
  }
});

// PATCH /notifications/:id/read — Mark single notification as read
router.patch("/:id/read", authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    await prisma.notification.updateMany({
      where: { id, userId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    res.status(200).json({
      success: true,
      message: "Notification marked as read.",
    });
  } catch (error) {
    console.error("Mark notification read error:", error);
    res.status(500).json({ success: false, error: "Failed to update notification." });
  }
});

// POST /notifications/read-all — Mark all user's notifications as read
router.post("/read-all", authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    res.status(200).json({
      success: true,
      message: "All notifications marked as read.",
    });
  } catch (error) {
    console.error("Mark all notifications read error:", error);
    res.status(500).json({ success: false, error: "Failed to mark all as read." });
  }
});

export default router;
