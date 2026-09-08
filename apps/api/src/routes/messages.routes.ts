import { Router, Request, Response } from "express";
import prisma from "../lib/prisma";
import { authenticate } from "../middleware/auth.middleware";
import { createNotification } from "./notifications.routes";

const router = Router({ mergeParams: true });

// In-memory typing tracker: contractId -> Map of userId -> { name, avatarUrl, lastTypedAt }
const typingState = new Map<string, Map<string, { name: string; avatarUrl: string | null; lastTypedAt: number }>>();

// Helper to clean and get active typing users for a contract
function getActiveTypingUsers(contractId: string, currentUserId: string) {
  const contractTyping = typingState.get(contractId);
  if (!contractTyping) return [];

  const now = Date.now();
  const active: Array<{ userId: string; name: string; avatarUrl: string | null }> = [];

  for (const [uid, data] of contractTyping.entries()) {
    // 3.5-second typing timeout
    if (now - data.lastTypedAt > 3500) {
      contractTyping.delete(uid);
    } else if (uid !== currentUserId) {
      active.push({
        userId: uid,
        name: data.name,
        avatarUrl: data.avatarUrl,
      });
    }
  }

  return active;
}

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

// POST /contracts/:id/typing — Signal user is actively typing
router.post("/:id/typing", authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const userId = req.user!.id;

    if (!typingState.has(id)) {
      typingState.set(id, new Map());
    }

    const contractTyping = typingState.get(id)!;
    contractTyping.set(userId, {
      name: req.user!.name,
      avatarUrl: req.user!.avatarUrl || null,
      lastTypedAt: Date.now(),
    });

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

// GET /contracts/:id/messages — Load message history for workspace
router.get("/:id/messages", authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const contract = await prisma.contract.findUnique({
      where: { id },
      select: { id: true, clientId: true, freelancerId: true },
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
        attachments: {
          select: { id: true, fileName: true, fileUrl: true, mimeType: true, sizeBytes: true },
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
      attachments: m.attachments,
    }));

    const typingUsers = getActiveTypingUsers(id, userId);

    res.status(200).json({
      success: true,
      data: formatted,
      typingUsers,
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
    const { content, attachments } = req.body;

    const hasText = typeof content === "string" && content.trim().length > 0;
    const hasAttachments = Array.isArray(attachments) && attachments.length > 0;

    if (!hasText && !hasAttachments) {
      res.status(400).json({ success: false, error: "Message content or attachment is required." });
      return;
    }

    const contract = await prisma.contract.findUnique({
      where: { id },
      select: { id: true, title: true, clientId: true, freelancerId: true },
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
        content: (content || "").trim(),
        attachments: hasAttachments
          ? {
              create: attachments.map((att: any) => ({
                fileName: att.fileName || "attachment",
                fileUrl: att.fileUrl,
                mimeType: att.mimeType || "application/octet-stream",
                sizeBytes: Number(att.sizeBytes) || 0,
                uploaderId: userId,
                contractId: contract.id,
              })),
            }
          : undefined,
      },
      include: {
        sender: {
          select: { id: true, name: true, avatarUrl: true, role: true },
        },
        attachments: {
          select: { id: true, fileName: true, fileUrl: true, mimeType: true, sizeBytes: true },
        },
      },
    });

    // Clear typing status for sender
    const contractTyping = typingState.get(id);
    if (contractTyping) {
      contractTyping.delete(userId);
    }

    // Dispatch in-app notification to the counterparty
    const recipientId = contract.clientId === userId ? contract.freelancerId : contract.clientId;
    const snippet = (content || "").trim().substring(0, 70);
    const notifText = snippet.length > 0 ? snippet : "Sent an attachment";

    await createNotification({
      userId: recipientId,
      type: "NEW_MESSAGE",
      title: `New message from ${req.user!.name}`,
      message: notifText,
      linkUrl: `/contracts/${contract.id}`,
      metadata: { contractId: contract.id, messageId: message.id },
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
        attachments: message.attachments,
      },
    });
  } catch (error) {
    console.error("Send message error:", error);
    res.status(500).json({ success: false, error: "Failed to send message" });
  }
});

export default router;

