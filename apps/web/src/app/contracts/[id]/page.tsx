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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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

interface WorkspaceMessage {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  senderAvatar: string | null;
  senderRole: string;
  isSender: boolean;
  createdAt: string;
}

export default function ContractWorkspacePage() {
  const params = useParams();
  const contractId = params?.id as string;
  const { user } = useAuth();
  const router = useRouter();

  const [workspace, setWorkspace] = React.useState<ContractWorkspace | null>(null);
  const [messages, setMessages] = React.useState<WorkspaceMessage[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [errorMsg, setErrorMsg] = React.useState("");

  // Chat message input state
  const [newMessage, setNewMessage] = React.useState("");
  const [sendingMessage, setSendingMessage] = React.useState(false);

  // Deliverables Modal state
  const [submitModalOpen, setSubmitModalOpen] = React.useState(false);
  const [selectedMilestoneId, setSelectedMilestoneId] = React.useState<string>("");
  const [deliverableNotes, setDeliverableNotes] = React.useState("");
  const [workUrl, setWorkUrl] = React.useState("");
  const [submittingDeliverable, setSubmittingDeliverable] = React.useState(false);

  // Milestone action feedback
  const [actionLoading, setActionLoading] = React.useState(false);
  const [statusFeedback, setStatusFeedback] = React.useState<{ type: "success" | "error"; text: string } | null>(null);

  // Review Form state
  const [reviewRating, setReviewRating] = React.useState(5);
  const [reviewComment, setReviewComment] = React.useState("");
  const [reviewSubmitting, setReviewSubmitting] = React.useState(false);
  const [reviewSubmitted, setReviewSubmitted] = React.useState(false);

  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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
        setMessages(res.data);
      }
    } catch (err) {
      console.error("Failed to load messages:", err);
    }
  }, [contractId]);

  React.useEffect(() => {
    fetchWorkspace();
    fetchMessages();
  }, [fetchWorkspace, fetchMessages]);

  // Periodic polling for chat messages
  React.useEffect(() => {
    if (!contractId) return;
    const interval = setInterval(() => {
      fetchMessages();
    }, 4000);
    return () => clearInterval(interval);
  }, [contractId, fetchMessages]);

  React.useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sendingMessage) return;

    setSendingMessage(true);
    try {
      const res = await apiFetch(`/contracts/${contractId}/messages`, {
        method: "POST",
        body: JSON.stringify({ content: newMessage.trim() }),
      });

      if (res.success) {
        setNewMessage("");
        await fetchMessages();
        scrollToBottom();
      } else {
        setStatusFeedback({ type: "error", text: res.error || "Failed to send message." });
      }
    } catch (err) {
      console.error("Error sending message:", err);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleOpenSubmitModal = (milestoneId?: string) => {
    if (milestoneId) {
      setSelectedMilestoneId(milestoneId);
    } else if (workspace?.milestones) {
      const active = workspace.milestones.find((m) => m.status === "PENDING" || m.status === "IN_PROGRESS");
      if (active) setSelectedMilestoneId(active.id);
    }
    setSubmitModalOpen(true);
  };

  const handleSubmitDeliverable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMilestoneId) {
      setStatusFeedback({ type: "error", text: "Please select a milestone to submit." });
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
    if (!reviewComment || reviewComment.length < 10) {
      setStatusFeedback({ type: "error", text: "Please enter a review comment of at least 10 characters." });
      return;
    }
    setReviewSubmitting(true);
    try {
      const res = await apiFetch(`/contracts/${contractId}/reviews`, {
        method: "POST",
        body: JSON.stringify({ rating: reviewRating, comment: reviewComment }),
      });
      if (res.success) {
        setReviewSubmitted(true);
        setStatusFeedback({ type: "success", text: "Verified review submitted successfully! Thank you." });
      } else {
        setStatusFeedback({ type: "error", text: res.error || "Failed to submit review." });
      }
    } catch (err: any) {
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
            <div className="h-9 w-9 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm">
              {workspace.client.name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{workspace.client.name}</p>
                <Badge variant="default" className="text-[9px] py-0 px-1 font-bold">CLIENT</Badge>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{workspace.client.email}</p>
            </div>
          </Card>

          <Card className="p-3.5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm">
              {workspace.freelancer.name.charAt(0)}
            </div>
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
                      {milestone.description && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                          {milestone.description}
                        </p>
                      )}
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
                      {isFreelancer && (milestone.status === "PENDING" || milestone.status === "IN_PROGRESS") && (
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
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
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

                    <div>
                      <Input
                        placeholder="Write a verified review comment (e.g. Excellent communication and top quality deliverable)..."
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        className="text-xs h-10"
                      />
                    </div>

                    <Button
                      type="submit"
                      size="sm"
                      disabled={reviewSubmitting}
                      className="font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                    >
                      {reviewSubmitting ? "Submitting..." : "Submit Verified Review"}
                    </Button>
                  </form>
                ) : (
                  <p className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" /> Your verified review has been published on the platform.
                  </p>
                )}
              </Card>
            )}
          </div>

          {/* RIGHT COLUMN: Live Project Chat (5 cols) */}
          <div className="lg:col-span-5 sticky top-20">
            <Card className="p-0 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-card dark:shadow-none flex flex-col h-[650px] overflow-hidden">
              {/* Chat Header */}
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-brand-600" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Live Project Chat</h3>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      {isClient ? `Chatting with ${workspace.freelancer.name}` : `Chatting with ${workspace.client.name}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-bold">Online</span>
                </div>
              </div>

              {/* Message History */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/30 dark:bg-slate-950/30">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 dark:text-slate-500">
                    <MessageSquare className="h-8 w-8 mb-2 opacity-40" />
                    <p className="text-xs font-semibold">No messages in this workspace yet.</p>
                    <p className="text-[11px] mt-1 text-slate-400">
                      Say hello or discuss milestone requirements to kickstart the project.
                    </p>
                  </div>
                ) : (
                  messages.map((m) => (
                    <div
                      key={m.id}
                      className={`flex flex-col ${m.isSender ? "items-end" : "items-start"}`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 px-1">
                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">
                          {m.isSender ? "You" : m.senderName}
                        </span>
                        <span className="text-[9px] text-slate-400 dark:text-slate-500">
                          {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <div
                        className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed break-words whitespace-pre-line ${
                          m.isSender
                            ? "bg-brand-600 text-white rounded-br-none shadow-sm"
                            : "bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 text-slate-800 dark:text-slate-100 rounded-bl-none shadow-xs"
                        }`}
                      >
                        {m.content}
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input Box */}
              <form
                onSubmit={handleSendMessage}
                className="p-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2"
              >
                <Input
                  placeholder="Type a message or discuss milestone..."
                  className="flex-1 h-10 text-xs"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  disabled={sendingMessage}
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={sendingMessage || !newMessage.trim()}
                  className="gap-1.5 font-bold text-xs h-10 px-4 shrink-0 shadow-sm"
                >
                  <Send className="h-3.5 w-3.5" />
                  Send
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
              {workspace.milestones.length > 1 && (
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
              )}

              {/* Work Notes / Summary */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Deliverable Summary &amp; Work Description <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
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
                  disabled={submittingDeliverable || !deliverableNotes.trim()}
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
