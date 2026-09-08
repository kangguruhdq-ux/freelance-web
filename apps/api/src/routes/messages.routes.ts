import { Router, Request, Response } from "express";
import prisma from "../lib/prisma";
import { authenticate } from "../middleware/auth.middleware";
import { createNotification } from "./notifications.routes";
import { encodeDbText, decodeDbText } from "../lib/db-safe";

const router = Router({ mergeParams: true });

// In-memory typing tracker: contractId -> Map of userId -> { name, avatarUrl, lastTypedAt }
const typingState = new Map<string, Map<string, { name: string; avatarUrl: string | null; lastTypedAt: number }>>();

// In-memory block tracker: blockerUserId -> Set of blockedUserIds
const blockedContacts = new Map<string, Set<string>>();

function isUserBlocked(blockerId: string, blockedId: string): boolean {
  return blockedContacts.get(blockerId)?.has(blockedId) || false;
}

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

    const recipientId = contract.clientId === userId ? contract.freelancerId : contract.clientId;
    const isBlockedByMe = isUserBlocked(userId, recipientId);
    const isBlockedByThem = isUserBlocked(recipientId, userId);

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

    const formatted = messages.map((m) => {
      const isDeleted = m.content === "This message was deleted";
      const isEdited = !isDeleted && (m.updatedAt.getTime() - m.createdAt.getTime() > 1000);
      return {
        id: m.id,
        content: decodeDbText(m.content),
        senderId: m.senderId,
        senderName: m.sender.name,
        senderAvatar: m.sender.avatarUrl,
        senderRole: m.sender.role,
        isSender: m.senderId === userId,
        isDeleted,
        isEdited,
        createdAt: m.createdAt.toISOString(),
        updatedAt: m.updatedAt.toISOString(),
        attachments: isDeleted
          ? []
          : m.attachments.map((att) => ({
              ...att,
              fileName: decodeDbText(att.fileName),
            })),
      };
    });

    const typingUsers = getActiveTypingUsers(id, userId);

    res.status(200).json({
      success: true,
      data: formatted,
      typingUsers,
      blockStatus: {
        isBlockedByMe,
        isBlockedByThem,
        isBlocked: isBlockedByMe || isBlockedByThem,
      },
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

    // Block verification
    const recipientId = contract.clientId === userId ? contract.freelancerId : contract.clientId;
    if (isUserBlocked(userId, recipientId)) {
      res.status(403).json({
        success: false,
        error: "You have blocked this contact. Unblock to send messages.",
      });
      return;
    }
    if (isUserBlocked(recipientId, userId)) {
      res.status(403).json({
        success: false,
        error: "You cannot send messages because you have been blocked by this user.",
      });
      return;
    }

    const conversationId = await getOrCreateContractConversation(contract.clientId, contract.freelancerId);

    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: userId,
        content: encodeDbText((content || "").trim()),
        attachments: hasAttachments
          ? {
              create: attachments.map((att: any) => ({
                fileName: encodeDbText(att.fileName || "attachment"),
                fileUrl: att.fileUrl,
                mimeType: att.mimeType || "application/octet-stream",
                sizeBytes: Math.min(Math.floor(Math.abs(Number(att.sizeBytes) || 0)), 2147483647),
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
    const snippet = (content || "").trim().substring(0, 70);
    const notifText = snippet.length > 0 ? snippet : "Sent an attachment";

    await createNotification({
      userId: recipientId,
      type: "NEW_MESSAGE",
      title: `New message from ${req.user!.name}`,
      message: encodeDbText(notifText),
      linkUrl: `/contracts/${contract.id}`,
      metadata: { contractId: contract.id, messageId: message.id },
    });

    res.status(201).json({
      success: true,
      message: {
        id: message.id,
        content: decodeDbText(message.content),
        senderId: message.senderId,
        senderName: message.sender.name,
        senderAvatar: message.sender.avatarUrl,
        senderRole: message.sender.role,
        isSender: true,
        isDeleted: false,
        isEdited: false,
        createdAt: message.createdAt.toISOString(),
        updatedAt: message.updatedAt.toISOString(),
        attachments: message.attachments.map((att) => ({
          ...att,
          fileName: decodeDbText(att.fileName),
        })),
      },
    });
  } catch (error) {
    console.error("Send message error:", error);
    res.status(500).json({ success: false, error: "Failed to send message" });
  }
});

// PUT /contracts/:id/messages/:messageId — Edit message
router.put("/:id/messages/:messageId", authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const messageId = Array.isArray(req.params.messageId) ? req.params.messageId[0] : req.params.messageId;
    const { content } = req.body;
    const userId = req.user!.id;

    if (!content || typeof content !== "string" || !content.trim()) {
      res.status(400).json({ success: false, error: "Message content cannot be empty." });
      return;
    }

    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      res.status(404).json({ success: false, error: "Message not found" });
      return;
    }

    if (message.senderId !== userId && req.user!.role !== "ADMIN") {
      res.status(403).json({ success: false, error: "You can only edit your own messages." });
      return;
    }

    if (message.content === "This message was deleted") {
      res.status(400).json({ success: false, error: "Deleted messages cannot be edited." });
      return;
    }

    const updated = await prisma.message.update({
      where: { id: messageId },
      data: {
        content: encodeDbText(content.trim()),
        updatedAt: new Date(),
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

    res.status(200).json({
      success: true,
      message: {
        id: updated.id,
        content: decodeDbText(updated.content),
        senderId: updated.senderId,
        senderName: updated.sender.name,
        senderAvatar: updated.sender.avatarUrl,
        senderRole: updated.sender.role,
        isSender: updated.senderId === userId,
        isDeleted: false,
        isEdited: true,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
        attachments: updated.attachments.map((att) => ({
          ...att,
          fileName: decodeDbText(att.fileName),
        })),
      },
    });
  } catch (error) {
    console.error("Edit message error:", error);
    res.status(500).json({ success: false, error: "Failed to edit message" });
  }
});

// DELETE /contracts/:id/messages/:messageId — Delete message (WhatsApp retract style)
router.delete("/:id/messages/:messageId", authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const messageId = Array.isArray(req.params.messageId) ? req.params.messageId[0] : req.params.messageId;
    const userId = req.user!.id;

    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      res.status(404).json({ success: false, error: "Message not found" });
      return;
    }

    if (message.senderId !== userId && req.user!.role !== "ADMIN") {
      res.status(403).json({ success: false, error: "You can only delete your own messages." });
      return;
    }

    // Remove any attachments linked to this message
    await prisma.attachment.deleteMany({
      where: { messageId },
    });

    // Retract message content WhatsApp style
    const updated = await prisma.message.update({
      where: { id: messageId },
      data: {
        content: "This message was deleted",
      },
    });

    res.status(200).json({
      success: true,
      messageId: updated.id,
      content: updated.content,
      isDeleted: true,
    });
  } catch (error) {
    console.error("Delete message error:", error);
    res.status(500).json({ success: false, error: "Failed to delete message" });
  }
});

// POST /contracts/:id/block — Block counterparty
router.post("/:id/block", authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const userId = req.user!.id;

    const contract = await prisma.contract.findUnique({
      where: { id },
      select: { clientId: true, freelancerId: true },
    });

    if (!contract) {
      res.status(404).json({ success: false, error: "Contract not found" });
      return;
    }

    const recipientId = contract.clientId === userId ? contract.freelancerId : contract.clientId;
    if (!blockedContacts.has(userId)) {
      blockedContacts.set(userId, new Set());
    }
    blockedContacts.get(userId)!.add(recipientId);

    res.status(200).json({
      success: true,
      message: "Contact blocked successfully.",
      blockStatus: {
        isBlockedByMe: true,
        isBlockedByThem: isUserBlocked(recipientId, userId),
        isBlocked: true,
      },
    });
  } catch (error) {
    console.error("Block contact error:", error);
    res.status(500).json({ success: false, error: "Failed to block contact" });
  }
});

// POST /contracts/:id/unblock — Unblock counterparty
router.post("/:id/unblock", authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const userId = req.user!.id;

    const contract = await prisma.contract.findUnique({
      where: { id },
      select: { clientId: true, freelancerId: true },
    });

    if (!contract) {
      res.status(404).json({ success: false, error: "Contract not found" });
      return;
    }

    const recipientId = contract.clientId === userId ? contract.freelancerId : contract.clientId;
    if (blockedContacts.has(userId)) {
      blockedContacts.get(userId)!.delete(recipientId);
    }

    res.status(200).json({
      success: true,
      message: "Contact unblocked successfully.",
      blockStatus: {
        isBlockedByMe: false,
        isBlockedByThem: isUserBlocked(recipientId, userId),
        isBlocked: isUserBlocked(recipientId, userId),
      },
    });
  } catch (error) {
    console.error("Unblock contact error:", error);
    res.status(500).json({ success: false, error: "Failed to unblock contact" });
  }
});

export default router;

