import { Router, Request, Response } from "express";
import prisma from "../lib/prisma";
import { authenticate } from "../middleware/auth.middleware";

const router = Router({ mergeParams: true });

// Helper to get or create conversation between contract participants
async function getOrCreateContractConversation(clientId: string, freelancerId: string) {
  // Check if conversation already exists with both participants
  const existingParticipant = await prisma.conversationParticipant.findFirst({
    where: { userId: clientId },
    select: { conversationId: true },
  });

  if (existingParticipant) {
    const shared = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId: existingParticipant.conversationId,
        userId: freelancerId,
      },
    });

    if (shared) {
      return existingParticipant.conversationId;
    }
  }

  // Create new conversation
  const conv = await prisma.conversation.create({
    data: {
      participants: {
        create: [{ userId: clientId }, { userId: freelancerId }],
      },
    },
  });

  return conv.id;
}

// GET /contracts/:id/messages — Load message history for workspace
router.get("/:id/messages", authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const contract = await prisma.contract.findUnique({
      where: { id },
      select: { clientId: true, freelancerId: true },
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
        error: "Forbidden: You are not authorized to access messages in this contract workspace.",
      });
      return;
    }

    const conversationId = await getOrCreateContractConversation(contract.clientId, contract.freelancerId);

    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
      include: {
        sender: {
          select: { id: true, name: true, avatarUrl: true, role: true },
        },
      },
    });

    const formatted = messages.map((m) => ({
      id: m.id,
      content: m.content,
      senderId: m.senderId,
      senderName: m.sender.name,
      senderAvatar: m.sender.avatarUrl,
      senderRole: m.sender.role,
      isSender: m.senderId === userId,
      createdAt: m.createdAt.toISOString(),
    }));

    res.status(200).json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    console.error("Fetch messages error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch messages" });
  }
});

// POST /contracts/:id/messages — Send message in workspace
router.post("/:id/messages", authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { content } = req.body;

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      res.status(400).json({ success: false, error: "Message content cannot be empty." });
      return;
    }

    const contract = await prisma.contract.findUnique({
      where: { id },
      select: { clientId: true, freelancerId: true },
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
        error: "Forbidden: You are not authorized to send messages in this contract workspace.",
      });
      return;
    }

    const conversationId = await getOrCreateContractConversation(contract.clientId, contract.freelancerId);

    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: userId,
        content: content.trim(),
      },
      include: {
        sender: {
          select: { id: true, name: true, avatarUrl: true, role: true },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: {
        id: message.id,
        content: message.content,
        senderId: message.senderId,
        senderName: message.sender.name,
        senderAvatar: message.sender.avatarUrl,
        senderRole: message.sender.role,
        isSender: true,
        createdAt: message.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Send message error:", error);
    res.status(500).json({ success: false, error: "Failed to send message" });
  }
});

export default router;
