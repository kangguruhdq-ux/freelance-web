"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  DollarSign,
  FileText,
  MessageSquare,
  Send,
  ShieldCheck,
  User,
  AlertCircle,
  Sparkles,
  UploadCloud,
  ExternalLink,
  Star,
  RefreshCw,
  X,
  Briefcase,
  Paperclip,
  ArrowDown,
  MoreVertical,
  Ban,
  Download,
  Copy,
  Pencil,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { ChatMessageItem, ChatMessageData, ChatAttachment } from "@/components/chat/chat-message-item";
import { TypingIndicator } from "@/components/chat/typing-indicator";
import {
  FileAttachmentUpload,
  AttachedFile,
  getFileIcon,
  formatFileSize,
} from "@/components/ui/file-attachment-upload";
import { useToast } from "@/context/toast-context";
import { apiFetch } from "@/lib/api-client";

interface Milestone {
  id: string;
  title: string;
  description: string | null;
  amount: number;
  status: string;
  dueDate: string | null;
  submittedAt: string | null;
  approvedAt: string | null;
  attachments?: Array<{
    id: string;
    fileName: string;
    fileUrl: string;
    mimeType?: string;
    sizeBytes?: number;
    createdAt?: string;
  }>;
}

interface ContractWorkspace {
  id: string;
  contractNumber: string;
  title: string;
  totalAmount: number;
  escrowBalance: number;
  status: string;
  startDate: string;
  endDate: string | null;
  client: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
  };
  freelancer: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
    profile: {
      headline: string;
      rating: number;
    } | null;
  };
  job: {
    id: string;
    title: string;
    description: string;
    category: { name: string };
  };
  milestones: Milestone[];
}

function parseMilestoneDescription(desc: string | null) {
  if (!desc) return { notes: "", workUrl: null };
  const urlRegex = /(?:🔗 Work URL:\s*|🔗 Link:\s*|URL:\s*)?(https?:\/\/[^\s]+)/i;
  const match = desc.match(urlRegex);
  if (match) {
    const workUrl = match[1];
    const notes = desc.replace(match[0], "").trim();
    return { notes, workUrl };
  }
  return { notes: desc, workUrl: null };
}

export default function ContractWorkspacePage() {
  const params = useParams();
  const contractId = params?.id as string;
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [workspace, setWorkspace] = React.useState<ContractWorkspace | null>(null);
  const [messages, setMessages] = React.useState<ChatMessageData[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [errorMsg, setErrorMsg] = React.useState("");

  // Chat message input & attachments state
  const [newMessage, setNewMessage] = React.useState("");
  const [chatAttachments, setChatAttachments] = React.useState<ChatAttachment[]>([]);
  const [sendingMessage, setSendingMessage] = React.useState(false);
  const [typingUsers, setTypingUsers] = React.useState<Array<{ userId: string; name: string; avatarUrl?: string | null }>>([]);
  const [showScrollBottom, setShowScrollBottom] = React.useState(false);

  // WhatsApp-style chat features: block, edit, menu
  const [chatMenuOpen, setChatMenuOpen] = React.useState(false);
  const [editingMessage, setEditingMessage] = React.useState<ChatMessageData | null>(null);
  const [blockStatus, setBlockStatus] = React.useState<{
    isBlockedByMe: boolean;
    isBlockedByThem: boolean;
    isBlocked: boolean;
  }>({
    isBlockedByMe: false,
    isBlockedByThem: false,
    isBlocked: false,
  });
  const [blockLoading, setBlockLoading] = React.useState(false);

  // Deliverables Modal state
  const [submitModalOpen, setSubmitModalOpen] = React.useState(false);
  const [selectedMilestoneId, setSelectedMilestoneId] = React.useState<string>("");
  const [deliverableNotes, setDeliverableNotes] = React.useState("");
  const [workUrl, setWorkUrl] = React.useState("");
  const [deliverableFiles, setDeliverableFiles] = React.useState<AttachedFile[]>([]);
  const [submittingDeliverable, setSubmittingDeliverable] = React.useState(false);

  // Milestone action feedback
  const [actionLoading, setActionLoading] = React.useState(false);
  const [statusFeedback, setStatusFeedback] = React.useState<{ type: "success" | "error"; text: string } | null>(null);

  // Review Form state
  const [reviewRating, setReviewRating] = React.useState(5);
  const [reviewComment, setReviewComment] = React.useState("");
  const [reviewSubmitting, setReviewSubmitting] = React.useState(false);
  const [reviewSubmitted, setReviewSubmitted] = React.useState(false);
  const [reviewError, setReviewError] = React.useState<string | null>(null);
  const [contractReviews, setContractReviews] = React.useState<any[]>([]);

  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const chatScrollContainerRef = React.useRef<HTMLDivElement>(null);
  const lastTypingPingRef = React.useRef<number>(0);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const scrollToBottom = React.useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
  }, []);

  const handleChatScroll = () => {
    if (!chatScrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatScrollContainerRef.current;
    const isAway = scrollHeight - scrollTop - clientHeight > 100;
    setShowScrollBottom(isAway);
  };

  const fetchWorkspace = React.useCallback(async () => {
    if (!contractId) return;
    try {
      const res = await apiFetch(`/contracts/${contractId}`);
      if (!res.success) {
        if (res.status === 403) {
          setErrorMsg("Forbidden: You are not an authorized participant in this project workspace.");
        } else {
          setErrorMsg(res.error || "Contract not found.");
        }
        return;
      }
      if (res.contract) {
        setWorkspace(res.contract);
        if (res.contract.milestones && res.contract.milestones.length > 0 && !selectedMilestoneId) {
          const active = res.contract.milestones.find((m: Milestone) => m.status === "PENDING" || m.status === "IN_PROGRESS");
          setSelectedMilestoneId(active ? active.id : res.contract.milestones[0].id);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load workspace.");
    } finally {
      setLoading(false);
    }
  }, [contractId, selectedMilestoneId]);

  const fetchMessages = React.useCallback(async () => {
    if (!contractId) return;
    try {
      const res = await apiFetch(`/contracts/${contractId}/messages`);
      if (res.success && Array.isArray(res.data)) {
        setMessages((prev) => {
          // Retain pending optimistic messages until server confirms
          const pendingMessages = prev.filter((m) => m.pending);
          const serverIds = new Set(res.data.map((m: any) => m.id));
          const stillPending = pendingMessages.filter((p) => !serverIds.has(p.id));
          return [...res.data, ...stillPending];
        });
        if (Array.isArray(res.typingUsers)) {
          setTypingUsers(res.typingUsers);
        }
        if (res.blockStatus) {
          setBlockStatus(res.blockStatus);
        }
      }
    } catch (err) {
      console.error("Failed to load messages:", err);
    }
  }, [contractId]);

  const fetchContractReviews = React.useCallback(async () => {
    if (!contractId) return;
    try {
      const res = await apiFetch(`/contracts/${contractId}/reviews`);
      if (res.success && Array.isArray(res.data)) {
        setContractReviews(res.data);
        if (user?.id) {
          const myReview = res.data.find((r: any) => r.reviewerId === user.id);
          if (myReview) {
            setReviewSubmitted(true);
            setReviewRating(myReview.rating);
            setReviewComment(myReview.comment);
          }
        }
      }
    } catch (err) {
      console.warn("Failed to load contract reviews:", err);
    }
  }, [contractId, user?.id]);

  React.useEffect(() => {
    fetchWorkspace();
    fetchMessages();
    fetchContractReviews();
  }, [fetchWorkspace, fetchMessages, fetchContractReviews]);

  // Periodic polling for chat messages & typing status
  React.useEffect(() => {
    if (!contractId) return;
    const interval = setInterval(() => {
      fetchMessages();
    }, 3000);
    return () => clearInterval(interval);
  }, [contractId, fetchMessages]);

  React.useEffect(() => {
    if (!showScrollBottom) {
      scrollToBottom(false);
    }
  }, [messages.length, scrollToBottom, showScrollBottom]);

  // Handle typing activity signal
  const handleTypingActivity = () => {
    if (blockStatus.isBlocked) return;
    const now = Date.now();
    if (now - lastTypingPingRef.current > 2500) {
      lastTypingPingRef.current = now;
      apiFetch(`/contracts/${contractId}/typing`, { method: "POST" }).catch(() => {});
    }
  };

  // WhatsApp Block / Unblock Contact
  const handleToggleBlock = async () => {
    if (!contractId || blockLoading) return;
    setBlockLoading(true);
    setChatMenuOpen(false);
    try {
      const endpoint = blockStatus.isBlockedByMe ? `/contracts/${contractId}/unblock` : `/contracts/${contractId}/block`;
      const res = await apiFetch(endpoint, { method: "POST" });
      if (res.success) {
        toast.success(res.message || (blockStatus.isBlockedByMe ? "Contact unblocked." : "Contact blocked."));
        if (res.blockStatus) {
          setBlockStatus(res.blockStatus);
        } else {
          setBlockStatus((prev) => ({
            ...prev,
            isBlockedByMe: !prev.isBlockedByMe,
            isBlocked: !prev.isBlockedByMe || prev.isBlockedByThem,
          }));
        }
      } else {
        toast.error(res.error || "Failed to update block status.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to toggle block.");
    } finally {
      setBlockLoading(false);
    }
  };

  // WhatsApp Message Edit Handlers
  const handleStartEdit = (msg: ChatMessageData) => {
    setEditingMessage(msg);
    setNewMessage(msg.content);
  };

  const handleCancelEdit = () => {
    setEditingMessage(null);
    setNewMessage("");
  };

  // WhatsApp Message Delete Handler (retract)
  const handleDeleteMessage = async (msg: ChatMessageData) => {
    if (!contractId) return;
    try {
      const res = await apiFetch(`/contracts/${contractId}/messages/${msg.id}`, {
        method: "DELETE",
      });
      if (res.success) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === msg.id
              ? { ...m, content: "This message was deleted", isDeleted: true, attachments: [] }
              : m
          )
        );
        toast.success("Message deleted");
      } else {
        toast.error(res.error || "Failed to delete message");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to delete message");
    }
  };

  // Optimistic message dispatch
  const doSendMessage = async (text: string, attachments: ChatAttachment[]) => {
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: ChatMessageData = {
      id: tempId,
      content: text,
      senderId: user?.id || "",
      senderName: user?.name || "You",
      senderAvatar: user?.avatarUrl,
      senderRole: user?.role,
      isSender: true,
      createdAt: new Date().toISOString(),
      attachments: attachments.length > 0 ? attachments : undefined,
      pending: true,
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setTimeout(() => scrollToBottom(true), 50);

    try {
      const res = await apiFetch(`/contracts/${contractId}/messages`, {
        method: "POST",
        body: JSON.stringify({
          content: text,
          attachments: attachments.map((att) => ({
            fileName: att.fileName,
            fileUrl: att.fileUrl,
            mimeType: att.mimeType,
            sizeBytes: att.sizeBytes,
          })),
        }),
      });

      if (res.success && res.message) {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...(res.message as any), isSender: true, pending: false } : m))
        );
      } else {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...m, pending: false, error: true } : m))
        );
        toast.error(res.error || "Failed to deliver message. Click retry.");
      }
    } catch (err: any) {
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, pending: false, error: true } : m))
      );
      toast.error(err.message || "Network error. Click retry.");
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (blockStatus.isBlocked) {
      toast.error("Messaging is disabled because communication is blocked.");
      return;
    }

    const trimmed = newMessage.trim();

    // If editing existing message
    if (editingMessage) {
      if (!trimmed || sendingMessage) return;
      setSendingMessage(true);
      try {
        const res = await apiFetch(`/contracts/${contractId}/messages/${editingMessage.id}`, {
          method: "PUT",
          body: JSON.stringify({ content: trimmed }),
        });
        if (res.success && res.message) {
          setMessages((prev) =>
            prev.map((m) => (m.id === editingMessage.id ? { ...m, content: trimmed, isEdited: true } : m))
          );
          setEditingMessage(null);
          setNewMessage("");
          toast.success("Message edited");
        } else {
          toast.error(res.error || "Failed to edit message");
        }
      } catch (err: any) {
        toast.error(err.message || "Failed to edit message");
      } finally {
        setSendingMessage(false);
      }
      return;
    }

    if ((!trimmed && chatAttachments.length === 0) || sendingMessage) return;

    const content = trimmed;
    const atts = [...chatAttachments];

    setNewMessage("");
    setChatAttachments([]);

    await doSendMessage(content, atts);
  };

  const handleRetryMessage = async (failedMsg: ChatMessageData) => {
    setMessages((prev) => prev.filter((m) => m.id !== failedMsg.id));
    await doSendMessage(failedMsg.content, failedMsg.attachments || []);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (file.size > 3 * 1024 * 1024) {
        toast.error(`"${file.name}" exceeds the 3MB size limit.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        setChatAttachments((prev) => [
          ...prev,
          {
            id: `att-${Date.now()}-${Math.random()}`,
            fileName: file.name,
            fileUrl: dataUrl,
            mimeType: file.type,
            sizeBytes: file.size,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleOpenSubmitModal = (milestoneId?: string) => {
    if (milestoneId) {
      setSelectedMilestoneId(milestoneId);
    } else if (workspace?.milestones && workspace.milestones.length > 0) {
      const active = workspace.milestones.find(
        (m) => m.status === "PENDING" || m.status === "IN_PROGRESS" || m.status === "REJECTED"
      );
      if (active) {
        setSelectedMilestoneId(active.id);
      } else {
        setSelectedMilestoneId(workspace.milestones[0].id);
      }
    }
    setSubmitModalOpen(true);
  };

  const handleSubmitDeliverable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMilestoneId) {
      setStatusFeedback({ type: "error", text: "Please select a milestone to submit." });
      return;
    }

    if (!deliverableNotes.trim() && !workUrl.trim() && deliverableFiles.length === 0) {
      setStatusFeedback({
        type: "error",
        text: "Please provide a work description, a live preview link, or attach deliverable files.",
      });
      return;
    }

    setSubmittingDeliverable(true);
    setStatusFeedback(null);
    try {
      const res = await apiFetch(`/milestones/${selectedMilestoneId}/submit`, {
        method: "POST",
        body: JSON.stringify({
          deliverableNotes: deliverableNotes.trim() || undefined,
          workUrl: workUrl.trim() || undefined,
          files: deliverableFiles.map((f) => ({
            fileName: f.fileName,
            fileUrl: f.fileUrl,
            mimeType: f.mimeType,
            sizeBytes: f.sizeBytes,
          })),
        }),
      });

      if (res.success) {
        setStatusFeedback({
          type: "success",
          text: "🚀 Deliverables submitted successfully! The client has been notified.",
        });
        setSubmitModalOpen(false);
        setDeliverableNotes("");
        setWorkUrl("");
        setDeliverableFiles([]);
        await fetchWorkspace();
        await fetchMessages();
      } else {
        setStatusFeedback({ type: "error", text: res.error || "Failed to submit deliverables." });
      }
    } catch (err: any) {
      setStatusFeedback({ type: "error", text: err.message || "Network error while submitting." });
    } finally {
      setSubmittingDeliverable(false);
    }
  };

  const handleMilestoneAction = async (milestoneId: string, action: "approve" | "revision") => {
    setActionLoading(true);
    setStatusFeedback(null);
    try {
      const res = await apiFetch(`/milestones/${milestoneId}/${action}`, {
        method: "POST",
      });
      if (res.success) {
        setStatusFeedback({
          type: "success",
          text: res.message || `Milestone ${action === "approve" ? "approved" : "revision requested"} successfully.`,
        });
        await fetchWorkspace();
        await fetchMessages();
      } else {
        setStatusFeedback({ type: "error", text: res.error || "Action failed." });
      }
    } catch (err: any) {
      setStatusFeedback({ type: "error", text: err.message || "Network error." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleFundEscrow = async (milestoneId: string) => {
    setActionLoading(true);
    setStatusFeedback(null);
    try {
      const res = await apiFetch(`/payments/milestones/${milestoneId}/fund`, { method: "POST" });
      if (res.success) {
        setStatusFeedback({
          type: "success",
          text: res.message || "Escrow funds locked securely in contract balance.",
        });
        await fetchWorkspace();
      } else {
        setStatusFeedback({ type: "error", text: res.error || "Failed to fund escrow." });
      }
    } catch (err: any) {
      setStatusFeedback({ type: "error", text: err.message || "Network error funding escrow." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReleasePayment = async (milestoneId: string) => {
    setActionLoading(true);
    setStatusFeedback(null);
    try {
      const res = await apiFetch(`/payments/milestones/${milestoneId}/release`, { method: "POST" });
      if (res.success) {
        setStatusFeedback({
          type: "success",
          text: res.message || "Payment successfully released to freelancer!",
        });
        await fetchWorkspace();
        await fetchMessages();
      } else {
        setStatusFeedback({ type: "error", text: res.error || "Failed to release payment." });
      }
    } catch (err: any) {
      setStatusFeedback({ type: "error", text: err.message || "Network error releasing payment." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewError(null);
    const trimmed = reviewComment.trim();
    if (!trimmed) {
      setReviewError("Please write a review comment before submitting.");
      return;
    }
    setReviewSubmitting(true);
    try {
      const res = await apiFetch(`/contracts/${contractId}/reviews`, {
        method: "POST",
        body: JSON.stringify({ rating: reviewRating, comment: trimmed }),
      });
      if (res.success) {
        setReviewSubmitted(true);
        setStatusFeedback({ type: "success", text: "Verified review submitted successfully! Thank you." });
        await fetchContractReviews();
        await fetchWorkspace();
      } else {
        setReviewError(res.error || "Failed to submit review.");
        setStatusFeedback({ type: "error", text: res.error || "Failed to submit review." });
      }
    } catch (err: any) {
      setReviewError(err.message || "Failed to submit review.");
      setStatusFeedback({ type: "error", text: err.message || "Failed to submit review." });
    } finally {
      setReviewSubmitting(false);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen py-24 flex items-center justify-center">
        <div className="h-8 w-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (errorMsg || !workspace) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-4">
        <AlertCircle className="h-12 w-12 text-rose-500 mx-auto" />
        <h2 className="text-2xl font-bold text-slate-900">Workspace Access Restricted</h2>
        <p className="text-slate-600 text-sm max-w-md mx-auto">{errorMsg || "Unable to access workspace."}</p>
        <Link href="/dashboard">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  const isClient = user?.id === workspace.client.id;
  const isFreelancer = user?.id === workspace.freelancer.id;
  const hasSubmittableMilestones = workspace.milestones.some(
    (m) => m.status === "PENDING" || m.status === "IN_PROGRESS"
  );
  const hasSubmittedMilestones = workspace.milestones.some((m) => m.status === "SUBMITTED");

  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-slate-950 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <Link
              href={isClient ? "/client/dashboard" : "/freelancer/dashboard"}
              className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors shadow-sm"
              title="Return to Dashboard"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400">
                  {workspace.contractNumber}
                </span>
                <Badge
                  variant={
                    workspace.status === "ACTIVE"
                      ? "success"
                      : workspace.status === "COMPLETED"
                      ? "default"
                      : "secondary"
                  }
                  className="text-[10px] font-bold uppercase"
                >
                  {workspace.status}
                </Badge>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5" /> Escrow Protected
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {workspace.title}
              </h1>
            </div>
          </div>

          {/* Value & Actions Bar */}
          <div className="flex items-center gap-3">
            <div className="bg-white dark:bg-slate-900 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Contract Value</p>
                <p className="text-lg font-black text-slate-900 dark:text-white">
                  ${workspace.totalAmount.toLocaleString()}
                </p>
              </div>
              <span className="h-6 w-px bg-slate-200 dark:bg-slate-800" />
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Escrow Balance
                </p>
                <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                  ${workspace.escrowBalance.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Prominent Submit Deliverable button in header for Freelancers */}
            {isFreelancer && workspace.status === "ACTIVE" && hasSubmittableMilestones && (
              <Button
                onClick={() => handleOpenSubmitModal()}
                className="gap-2 font-bold shadow-md bg-brand-600 hover:bg-brand-700 text-white"
              >
                <UploadCloud className="h-4 w-4" />
                Submit Deliverable
              </Button>
            )}
          </div>
        </div>

        {/* Feedback Alert Banner */}
        {statusFeedback && (
          <div
            className={`p-4 rounded-xl text-sm font-semibold flex items-center justify-between gap-3 border ${
              statusFeedback.type === "success"
                ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200"
                : "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200"
            }`}
          >
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 shrink-0" />
              <span>{statusFeedback.text}</span>
            </div>
            <button
              onClick={() => setStatusFeedback(null)}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Participants Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="p-3.5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 flex items-center gap-3">
            <Avatar
              src={workspace.client.avatarUrl}
              fallback={workspace.client.name}
              size="md"
              className="ring-2 ring-brand-500/20"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{workspace.client.name}</p>
                <Badge variant="default" className="text-[9px] py-0 px-1 font-bold">CLIENT</Badge>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{workspace.client.email}</p>
            </div>
          </Card>

          <Card className="p-3.5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 flex items-center gap-3">
            <Avatar
              src={workspace.freelancer.avatarUrl}
              fallback={workspace.freelancer.name}
              size="md"
              status={((workspace.freelancer as any).profile?.availability as any) || "AVAILABLE"}
              className="ring-2 ring-emerald-500/20"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{workspace.freelancer.name}</p>
                <Badge variant="secondary" className="text-[9px] py-0 px-1 font-bold">FREELANCER</Badge>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {workspace.freelancer.email}
                {workspace.freelancer.profile?.headline ? ` • ${workspace.freelancer.profile.headline}` : ""}
              </p>
            </div>
          </Card>
        </div>

        {/* 2-Column Main Workspace Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: Milestones, Work Deliverables & Project Scope (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Freelancer Action Banner */}
            {isFreelancer && workspace.status === "ACTIVE" && hasSubmittableMilestones && (
              <Card className="p-5 bg-gradient-to-r from-brand-50 to-indigo-50 dark:from-brand-950/40 dark:to-indigo-950/30 border-brand-200 dark:border-brand-800/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Work In Progress — Ready to Deliver?
                    </h3>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Submit your completed code, live URL preview, or work documentation for client review.
                  </p>
                </div>
                <Button
                  onClick={() => handleOpenSubmitModal()}
                  className="gap-2 font-bold text-xs bg-brand-600 hover:bg-brand-700 text-white shrink-0 shadow-sm"
                >
                  <UploadCloud className="h-4 w-4" />
                  Submit Deliverable
                </Button>
              </Card>
            )}

            {/* Client Action Banner if Milestones Submitted */}
            {isClient && hasSubmittedMilestones && (
              <Card className="p-5 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Milestone Deliverables Awaiting Review
                    </h3>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Sophia Chen has submitted project deliverables for your inspection. Verify and approve to release payment.
                  </p>
                </div>
              </Card>
            )}

            {/* Milestones List Card */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-brand-600" />
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Contract Milestones ({workspace.milestones.length})
                  </h2>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Escrow protects both parties
                </span>
              </div>

              {workspace.milestones.map((milestone, idx) => (
                <Card
                  key={milestone.id}
                  className="p-5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-card dark:shadow-none space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold uppercase text-slate-400 dark:text-slate-500">
                          Milestone {idx + 1}
                        </span>
                        <Badge
                          variant={
                            milestone.status === "APPROVED"
                              ? "success"
                              : milestone.status === "SUBMITTED"
                              ? "warning"
                              : milestone.status === "IN_PROGRESS"
                              ? "default"
                              : "outline"
                          }
                          className="text-[10px] font-bold"
                        >
                          {milestone.status}
                        </Badge>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        {milestone.title}
                      </h3>

                      {(() => {
                        const { notes, workUrl } = parseMilestoneDescription(milestone.description);
                        const hasAttachments = milestone.attachments && milestone.attachments.length > 0;
                        const isSubmittedOrApproved = milestone.status === "SUBMITTED" || milestone.status === "APPROVED";

                        return (
                          <div className="space-y-3 pt-1">
                            {/* Scope Description */}
                            {notes && (
                              <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                                {notes}
                              </p>
                            )}

                            {/* Prominent Deliverable Showcase */}
                            {(isSubmittedOrApproved || workUrl || hasAttachments) && (
                              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/90 dark:border-slate-700/80 space-y-3 mt-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <UploadCloud className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                                    <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                                      Project Deliverables &amp; Proof of Work
                                    </span>
                                  </div>
                                  {milestone.submittedAt && (
                                    <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                                      Submitted {new Date(milestone.submittedAt).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>

                                {/* Live Project / Demo Link */}
                                {workUrl && (
                                  <div>
                                    <a
                                      href={workUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-xs hover:shadow-md transition group"
                                    >
                                      <ExternalLink className="h-4 w-4 shrink-0 group-hover:scale-110 transition-transform" />
                                      <span className="truncate">View Live Project Demo / Repository</span>
                                    </a>
                                  </div>
                                )}

                                {/* Attached Deliverable Files */}
                                {hasAttachments && (
                                  <div className="space-y-1.5 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                                    <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                      <Paperclip className="h-3.5 w-3.5 text-brand-500" />
                                      <span>Attached Files ({milestone.attachments!.length}):</span>
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                      {milestone.attachments!.map((file) => (
                                        <a
                                          key={file.id}
                                          href={file.fileUrl}
                                          download={file.fileName}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 transition group shadow-2xs"
                                        >
                                          <div className="flex items-center gap-2 min-w-0 pr-1">
                                            {getFileIcon(file.mimeType || "", file.fileName)}
                                            <span className="truncate font-medium group-hover:text-brand-600 dark:group-hover:text-brand-400">
                                              {file.fileName}
                                            </span>
                                            {file.sizeBytes ? (
                                              <span className="text-[10px] text-slate-400 shrink-0">
                                                ({formatFileSize(file.sizeBytes)})
                                              </span>
                                            ) : null}
                                          </div>
                                          <Download className="h-3.5 w-3.5 shrink-0 text-slate-400 group-hover:text-brand-600 transition" />
                                        </a>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>

                    <div className="sm:text-right shrink-0">
                      <p className="text-[10px] font-semibold uppercase text-slate-400">Milestone Value</p>
                      <p className="text-xl font-black text-slate-900 dark:text-white">
                        ${milestone.amount.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Milestone Action Controls */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                    <div className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      {milestone.approvedAt
                        ? `Approved on ${new Date(milestone.approvedAt).toLocaleDateString()}`
                        : milestone.submittedAt
                        ? `Submitted on ${new Date(milestone.submittedAt).toLocaleDateString()}`
                        : "Ready for freelancer execution"}
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Freelancer Submit Deliverable Button */}
                      {isFreelancer &&
                        (milestone.status === "PENDING" ||
                          milestone.status === "IN_PROGRESS" ||
                          milestone.status === "REJECTED") && (
                          <Button
                            size="sm"
                            disabled={actionLoading}
                            onClick={() => handleOpenSubmitModal(milestone.id)}
                            className="gap-1.5 font-bold text-xs bg-brand-600 hover:bg-brand-700 text-white shadow-sm"
                          >
                            <UploadCloud className="h-3.5 w-3.5" />
                            Submit Deliverable
                          </Button>
                        )}

                      {/* Client Actions */}
                      {isClient && (
                        <>
                          {milestone.status === "PENDING" && (
                            <Button
                              size="sm"
                              disabled={actionLoading}
                              onClick={() => handleFundEscrow(milestone.id)}
                              className="font-bold text-xs bg-brand-600 hover:bg-brand-700 text-white shadow-sm"
                            >
                              Fund Escrow (${milestone.amount.toLocaleString()})
                            </Button>
                          )}

                          {milestone.status === "SUBMITTED" && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={actionLoading}
                                onClick={() => handleMilestoneAction(milestone.id, "revision")}
                                className="font-semibold text-xs text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/80"
                              >
                                Request Revision
                              </Button>
                              <Button
                                size="sm"
                                disabled={actionLoading}
                                onClick={() => handleReleasePayment(milestone.id)}
                                className="font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                              >
                                Release Payment (${milestone.amount.toLocaleString()})
                              </Button>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Project Scope Card */}
            <Card className="p-5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-card dark:shadow-none space-y-3">
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-brand-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Project Scope &amp; Specification</h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {workspace.job.description}
              </p>
            </Card>

            {/* Verified Review Section when COMPLETED */}
            {workspace.status === "COMPLETED" && (
              <Card className="p-6 bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 shadow-card dark:shadow-none space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Project Successfully Completed &amp; Escrow Released
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      All milestone deliverables have been accepted. Funds have been distributed to the freelancer.
                    </p>
                  </div>
                </div>

                {!reviewSubmitted ? (
                  <form onSubmit={handleReviewSubmit} className="pt-2 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Your Rating:</span>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            type="button"
                            key={star}
                            onClick={() => setReviewRating(star)}
                            className="p-1 hover:scale-110 transition-transform"
                          >
                            <Star
                              className={`h-5 w-5 ${
                                star <= reviewRating
                                  ? "text-amber-400 fill-amber-400"
                                  : "text-slate-300 dark:text-slate-600"
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{reviewRating} / 5</span>
                    </div>

                    {/* Quick Review Presets */}
                    <div className="space-y-1.5">
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">Quick feedback presets (click to select):</p>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          "Outstanding work and timely delivery! 🚀",
                          "Great communication and top quality code! 👍",
                          "Highly recommended freelancer! ⭐",
                          "Professional and very responsive!",
                        ].map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => {
                              setReviewComment(preset);
                              if (reviewError) setReviewError(null);
                            }}
                            className="px-2.5 py-1 text-[11px] font-medium rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition cursor-pointer"
                          >
                            {preset}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Input
                        placeholder="Write a verified review comment (e.g. Excellent communication and top quality deliverable)..."
                        value={reviewComment}
                        onChange={(e) => {
                          setReviewComment(e.target.value);
                          if (reviewError) setReviewError(null);
                        }}
                        className={`text-xs h-10 ${reviewError ? "border-rose-400 ring-1 ring-rose-400" : ""}`}
                      />
                    </div>

                    {/* Inline error feedback */}
                    {reviewError && (
                      <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs font-semibold text-rose-700 dark:text-rose-300 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{reviewError}</span>
                      </div>
                    )}

                    <Button
                      type="submit"
                      size="sm"
                      disabled={reviewSubmitting}
                      className="gap-1.5 font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm cursor-pointer"
                    >
                      {reviewSubmitting ? (
                        <>
                          <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Submitting Review...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4" />
                          Submit Verified Review
                        </>
                      )}
                    </Button>
                  </form>
                ) : (
                  <div className="space-y-3">
                    <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200/80 dark:border-emerald-800/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                          <span>Your Verified Platform Review</span>
                        </p>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-4 w-4 ${
                                star <= reviewRating
                                  ? "text-amber-400 fill-amber-400"
                                  : "text-slate-200 dark:text-slate-700"
                              }`}
                            />
                          ))}
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1">
                            {reviewRating} / 5
                          </span>
                        </div>
                      </div>
                      {reviewComment && (
                        <p className="text-xs text-slate-700 dark:text-slate-300 italic bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                          &ldquo;{reviewComment}&rdquo;
                        </p>
                      )}
                    </div>

                    {/* Show counterparty reviews if available */}
                    {contractReviews.filter((r) => r.reviewerId !== user?.id).map((r) => (
                      <div key={r.id} className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            Review from {r.reviewer?.name || "Counterparty"}
                          </p>
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-3.5 w-3.5 ${
                                  star <= r.rating
                                    ? "text-amber-400 fill-amber-400"
                                    : "text-slate-200 dark:text-slate-700"
                                }`}
                              />
                            ))}
                            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 ml-1">
                              {r.rating} / 5
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 italic">
                          &ldquo;{r.comment}&rdquo;
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}
          </div>

          {/* RIGHT COLUMN: Live Project Chat (5 cols) */}
          <div className="lg:col-span-5 sticky top-20">
            <Card className="p-0 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-card dark:shadow-none flex flex-col h-[650px] overflow-hidden relative">
              {/* WhatsApp-Style Chat Header */}
              <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 flex items-center justify-between relative z-20">
                <div className="flex items-center gap-2.5">
                  <Avatar
                    src={isClient ? workspace.freelancer.avatarUrl : workspace.client.avatarUrl}
                    fallback={isClient ? workspace.freelancer.name : workspace.client.name}
                    size="sm"
                    status={isClient ? (((workspace.freelancer as any).profile?.availability as any) || "AVAILABLE") : undefined}
                  />
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                      {isClient ? workspace.freelancer.name : workspace.client.name}
                    </h3>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      {isClient ? "Freelancer" : "Project Client"} • Escrow Workspace
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 relative">
                  <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200/50 dark:border-emerald-800/50">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[9px] font-bold">Active</span>
                  </div>

                  {/* WhatsApp 3-dots dropdown menu button */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setChatMenuOpen((prev) => !prev)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition"
                      title="Chat options"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>

                    {chatMenuOpen && (
                      <div className="absolute right-0 top-8 w-48 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl py-1 z-30 text-xs animate-in fade-in zoom-in-95 duration-150">
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(workspace.contractNumber);
                            toast.success("Contract number copied to clipboard!");
                            setChatMenuOpen(false);
                          }}
                          className="w-full text-left px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center gap-2"
                        >
                          <Copy className="h-3.5 w-3.5" />
                          <span>Copy Contract #</span>
                        </button>

                        <Link
                          href={isClient ? `/freelancers/${workspace.freelancer.id}` : `/clients/${workspace.client.id}`}
                          onClick={() => setChatMenuOpen(false)}
                          className="w-full text-left px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center gap-2"
                        >
                          <User className="h-3.5 w-3.5" />
                          <span>View Profile</span>
                        </Link>

                        <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />

                        <button
                          type="button"
                          disabled={blockLoading}
                          onClick={handleToggleBlock}
                          className={`w-full text-left px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 ${
                            blockStatus.isBlockedByMe
                              ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                              : "text-rose-600 dark:text-rose-400 font-semibold"
                          }`}
                        >
                          {blockStatus.isBlockedByMe ? (
                            <>
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>Unblock {isClient ? "Freelancer" : "Client"}</span>
                            </>
                          ) : (
                            <>
                              <Ban className="h-3.5 w-3.5" />
                              <span>Block {isClient ? "Freelancer" : "Client"}</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Message History */}
              <div
                ref={chatScrollContainerRef}
                onScroll={handleChatScroll}
                className="flex-1 p-4 overflow-y-auto space-y-1 bg-slate-50/40 dark:bg-slate-950/40 scroll-smooth"
              >
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 dark:text-slate-500">
                    <MessageSquare className="h-8 w-8 mb-2 opacity-40" />
                    <p className="text-xs font-semibold">No messages in this workspace yet.</p>
                    <p className="text-[11px] mt-1 text-slate-400 max-w-xs">
                      Say hello, share requirements, or clarify milestone deliverable expectations.
                    </p>
                  </div>
                ) : (
                  messages.map((m, idx) => {
                    const prev = messages[idx - 1];
                    const next = messages[idx + 1];

                    const isFirstInGroup =
                      idx === 0 ||
                      prev.senderId !== m.senderId ||
                      Math.abs(new Date(m.createdAt).getTime() - new Date(prev.createdAt).getTime()) > 5 * 60 * 1000;

                    const isLastInGroup =
                      idx === messages.length - 1 ||
                      next.senderId !== m.senderId ||
                      Math.abs(new Date(next.createdAt).getTime() - new Date(m.createdAt).getTime()) > 5 * 60 * 1000;

                    return (
                      <ChatMessageItem
                        key={m.id}
                        message={m}
                        isFirstInGroup={isFirstInGroup}
                        isLastInGroup={isLastInGroup}
                        onRetry={handleRetryMessage}
                        onEdit={handleStartEdit}
                        onDelete={handleDeleteMessage}
                      />
                    );
                  })
                )}

                {/* Typing Indicator */}
                <TypingIndicator users={typingUsers} className="mt-2" />
                <div ref={messagesEndRef} />
              </div>

              {/* Floating Scroll to Latest Button */}
              {showScrollBottom && (
                <button
                  type="button"
                  onClick={() => scrollToBottom(true)}
                  className="absolute bottom-20 right-4 z-20 p-2 rounded-full bg-brand-600 hover:bg-brand-700 text-white shadow-lg transition-transform hover:scale-105 active:scale-95 animate-in fade-in zoom-in duration-200"
                  title="Scroll to latest messages"
                >
                  <ArrowDown className="h-4 w-4" />
                </button>
              )}

              {/* Editing Banner */}
              {editingMessage && (
                <div className="px-3.5 py-2 bg-amber-50 dark:bg-amber-950/50 border-t border-amber-200 dark:border-amber-800 flex items-center justify-between text-xs animate-in fade-in duration-150">
                  <div className="flex items-center gap-2 min-w-0 pr-2">
                    <Pencil className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span className="font-bold text-amber-900 dark:text-amber-200 text-[11px]">Editing message:</span>
                    <span className="text-amber-700 dark:text-amber-300 truncate text-[11px]">
                      &quot;{editingMessage.content}&quot;
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="p-1 rounded text-amber-700 hover:text-amber-900 dark:text-amber-300 dark:hover:text-white"
                    title="Cancel edit"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              {/* WhatsApp Blocked Warning Banner */}
              {blockStatus.isBlocked && (
                <div className="px-3.5 py-2.5 bg-rose-50 dark:bg-rose-950/60 border-t border-rose-200 dark:border-rose-800 flex items-center justify-between text-xs text-rose-800 dark:text-rose-200">
                  <div className="flex items-center gap-2 min-w-0 pr-2">
                    <Ban className="h-4 w-4 shrink-0 text-rose-500" />
                    <span className="text-[11px] font-semibold">
                      {blockStatus.isBlockedByMe
                        ? "You have blocked this contact. Unblock to resume messaging."
                        : "You cannot send messages because communication has been blocked."}
                    </span>
                  </div>
                  {blockStatus.isBlockedByMe && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={blockLoading}
                      onClick={handleToggleBlock}
                      className="h-6 px-2 text-[10px] font-bold text-rose-700 border-rose-300 hover:bg-rose-100 dark:text-rose-200 dark:border-rose-700"
                    >
                      Unblock
                    </Button>
                  )}
                </div>
              )}

              {/* Attachment Preview Chips */}
              {chatAttachments.length > 0 && !blockStatus.isBlocked && (
                <div className="px-3 pt-2 pb-1 bg-slate-100/90 dark:bg-slate-800/90 border-t border-slate-200/80 dark:border-slate-700 flex flex-wrap gap-1.5">
                  {chatAttachments.map((att, i) => (
                    <span
                      key={att.id || i}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-600 shadow-2xs"
                    >
                      <Paperclip className="h-3 w-3 text-brand-500" />
                      <span className="truncate max-w-[120px]">{att.fileName}</span>
                      <button
                        type="button"
                        onClick={() => setChatAttachments((prev) => prev.filter((_, idx) => idx !== i))}
                        className="hover:text-rose-500 p-0.5 rounded"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Message Input Box */}
              <form
                onSubmit={handleSendMessage}
                className="p-2.5 border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-end gap-2"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  multiple
                  disabled={blockStatus.isBlocked}
                  className="hidden"
                  accept="image/*,application/pdf,.doc,.docx,.zip,.txt"
                />

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={blockStatus.isBlocked}
                  onClick={() => fileInputRef.current?.click()}
                  className="h-9 w-9 p-0 text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400 shrink-0 rounded-xl"
                  title="Attach files (max 3MB)"
                >
                  <Paperclip className="h-4 w-4" />
                </Button>

                <textarea
                  rows={1}
                  placeholder={
                    blockStatus.isBlocked
                      ? "Messaging is disabled (blocked)"
                      : editingMessage
                      ? "Edit your message... (Enter to update, Esc or cancel button to discard)"
                      : "Type a message... (Enter to send, Shift+Enter for newline)"
                  }
                  className="flex-1 min-h-[38px] max-h-24 p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-brand-500 resize-none leading-relaxed transition-all disabled:opacity-50"
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                    handleTypingActivity();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Escape" && editingMessage) {
                      handleCancelEdit();
                    } else {
                      handleKeyDown(e);
                    }
                  }}
                  disabled={sendingMessage || blockStatus.isBlocked}
                />

                <Button
                  type="submit"
                  size="sm"
                  disabled={
                    blockStatus.isBlocked ||
                    sendingMessage ||
                    (!newMessage.trim() && chatAttachments.length === 0)
                  }
                  className="gap-1.5 font-bold text-xs h-9 px-3.5 shrink-0 shadow-xs bg-brand-600 hover:bg-brand-700 text-white rounded-xl transition-all"
                >
                  {editingMessage ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Save</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Send</span>
                    </>
                  )}
                </Button>
              </form>
            </Card>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUBMIT DELIVERABLE MODAL */}
      {/* ========================================================================= */}
      {submitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400">
                  <UploadCloud className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Submit Work Deliverable
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Send completed deliverables to {workspace.client.name} for verification.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSubmitModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitDeliverable} className="space-y-4">
              {/* Milestone Target Selector */}
              {workspace.milestones.length > 1 ? (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Select Milestone
                  </label>
                  <select
                    value={selectedMilestoneId}
                    onChange={(e) => setSelectedMilestoneId(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                  >
                    {workspace.milestones.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.title} — ${m.amount.toLocaleString()} ({m.status})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
                  <div className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    Milestone: <span className="font-bold text-slate-900 dark:text-white">{workspace.milestones[0]?.title}</span>
                  </div>
                  <span className="text-xs font-bold text-brand-600 dark:text-brand-400">
                    ${workspace.milestones[0]?.amount.toLocaleString()}
                  </span>
                </div>
              )}

              {/* Work Notes / Summary */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Deliverable Summary &amp; Work Description</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    {deliverableFiles.length > 0 || workUrl.trim() ? "Optional" : "Required if no file/link"}
                  </span>
                </label>
                <textarea
                  rows={4}
                  placeholder="Summarize the completed work, test credentials, instructions for testing, or package overview..."
                  value={deliverableNotes}
                  onChange={(e) => setDeliverableNotes(e.target.value)}
                  className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 resize-none leading-relaxed"
                />
              </div>

              {/* Live Preview or Repository URL */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Live Work / Demo / Pull Request URL</span>
                  <span className="text-[10px] text-slate-400 font-normal">Optional</span>
                </label>
                <div className="relative">
                  <Input
                    type="url"
                    placeholder="https://github.com/my-repo or https://my-demo-app.vercel.app"
                    value={workUrl}
                    onChange={(e) => setWorkUrl(e.target.value)}
                    className="text-xs h-10 pr-8"
                  />
                  <ExternalLink className="h-3.5 w-3.5 absolute right-3 top-3 text-slate-400" />
                </div>
              </div>

              {/* Attached Deliverable Files */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Attach Deliverable Files</span>
                  <span className="text-[10px] text-slate-400 font-normal">Optional (ZIP, PDF, DOC, Images, max 10MB each)</span>
                </label>
                <FileAttachmentUpload
                  attachments={deliverableFiles}
                  onChange={setDeliverableFiles}
                  maxFiles={5}
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  🛡️ Escrow Guarantee:
                </p>
                <p>
                  Upon submission, the milestone status changes to <strong>SUBMITTED</strong>. An automatic notification is sent to the client chat. Once approved, escrow funds are instantly released to your balance.
                </p>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSubmitModalOpen(false)}
                  disabled={submittingDeliverable}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={
                    submittingDeliverable ||
                    (!deliverableNotes.trim() && !workUrl.trim() && deliverableFiles.length === 0)
                  }
                  className="gap-1.5 font-bold text-xs bg-brand-600 hover:bg-brand-700 text-white shadow-md"
                >
                  {submittingDeliverable ? (
                    <>
                      <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" />
                      Confirm &amp; Submit Work
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
