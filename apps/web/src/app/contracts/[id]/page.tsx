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
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  const [workspace, setWorkspace] = React.useState<ContractWorkspace | null>(null);
  const [messages, setMessages] = React.useState<WorkspaceMessage[]>([]);
  const [activeTab, setActiveTab] = React.useState<"milestones" | "messages" | "overview">("milestones");
  const [loading, setLoading] = React.useState(true);
  const [errorMsg, setErrorMsg] = React.useState("");

  // Chat message input state
  const [newMessage, setNewMessage] = React.useState("");
  const [sendingMessage, setSendingMessage] = React.useState(false);

  // Milestone action feedback
  const [actionLoading, setActionLoading] = React.useState(false);
  const [statusFeedback, setStatusFeedback] = React.useState<string | null>(null);

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
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load workspace.");
    } finally {
      setLoading(false);
    }
  }, [contractId]);

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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sendingMessage) return;

    setSendingMessage(true);
    try {
      const res = await apiFetch(`/contracts/${contractId}/messages`, {
        method: "POST",
        body: JSON.stringify({ content: newMessage }),
      });

      if (res.success) {
        setNewMessage("");
        await fetchMessages();
      }
    } catch (err) {
      console.error("Error sending message:", err);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleMilestoneAction = async (milestoneId: string, action: "submit" | "approve" | "revision") => {
    setActionLoading(true);
    setStatusFeedback(null);
    try {
      const res = await apiFetch(`/milestones/${milestoneId}/${action}`, {
        method: "POST",
      });
      if (res.success) {
        setStatusFeedback(res.message || "Milestone status updated successfully.");
        await fetchWorkspace();
      } else {
        setStatusFeedback(res.error || "Action failed.");
      }
    } catch (err: any) {
      setStatusFeedback(err.message || "Network error.");
    } finally {
      setActionLoading(false);
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

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href={isClient ? "/client/dashboard" : "/freelancer/dashboard"}
              className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400">
                  {workspace.contractNumber}
                </span>
                <Badge variant={workspace.status === "ACTIVE" ? "success" : "secondary"}>
                  {workspace.status}
                </Badge>
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {workspace.title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="text-right">
              <p className="text-[11px] font-semibold uppercase text-slate-400">Total Contract Value</p>
              <p className="text-xl font-black text-slate-900 dark:text-white">${workspace.totalAmount.toLocaleString()}</p>
            </div>
            <span className="h-8 w-px bg-slate-200 dark:bg-slate-800" />
            <div className="text-right">
              <p className="text-[11px] font-semibold uppercase text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5" /> Escrow Protected
              </p>
              <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">${workspace.totalAmount.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Participants Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-sm uppercase">
              {workspace.client.name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{workspace.client.name}</p>
                <Badge variant="default" className="text-[10px] py-0 px-1.5 font-bold">CLIENT</Badge>
              </div>
              <p className="text-xs text-slate-500 truncate">{workspace.client.email}</p>
            </div>
          </Card>

          <Card className="p-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm uppercase">
              {workspace.freelancer.name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{workspace.freelancer.name}</p>
                <Badge variant="secondary" className="text-[10px] py-0 px-1.5 font-bold">FREELANCER</Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{workspace.freelancer.email}</p>
            </div>
          </Card>
        </div>

        {/* Workspace Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setActiveTab("milestones")}
            className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "milestones"
                ? "border-brand-600 text-brand-600 dark:text-brand-400"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <CheckCircle2 className="h-4 w-4" />
            Milestones ({workspace.milestones.length})
          </button>

          <button
            onClick={() => setActiveTab("messages")}
            className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "messages"
                ? "border-brand-600 text-brand-600 dark:text-brand-400"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            Project Chat ({messages.length})
          </button>

          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "overview"
                ? "border-brand-600 text-brand-600 dark:text-brand-400"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <FileText className="h-4 w-4" />
            Project Scope
          </button>
        </div>

        {/* Status Action Feedback */}
        {statusFeedback && (
          <div className="p-3 rounded-xl bg-brand-50 border border-brand-200 text-brand-800 text-xs font-semibold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-brand-600" />
            {statusFeedback}
          </div>
        )}

        {/* Tab 1: Milestones */}
        {activeTab === "milestones" && (
          <div className="space-y-4">
            {workspace.milestones.map((milestone, idx) => (
              <Card key={milestone.id} className="p-6 bg-white border-slate-200 shadow-card space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase text-slate-400">
                        Milestone {idx + 1}
                      </span>
                      <Badge
                        variant={
                          milestone.status === "APPROVED"
                            ? "success"
                            : milestone.status === "SUBMITTED"
                            ? "warning"
                            : "outline"
                        }
                        className="text-[11px] font-bold"
                      >
                        {milestone.status}
                      </Badge>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">{milestone.title}</h3>
                    {milestone.description && (
                      <p className="text-xs sm:text-sm text-slate-600">{milestone.description}</p>
                    )}
                  </div>

                  <div className="sm:text-right shrink-0">
                    <p className="text-xs font-semibold text-slate-400">Milestone Value</p>
                    <p className="text-2xl font-black text-slate-900">${milestone.amount.toLocaleString()}</p>
                  </div>
                </div>

                {/* Milestone Action Controls */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs text-slate-400">
                    {milestone.approvedAt
                      ? `Approved on ${new Date(milestone.approvedAt).toLocaleDateString()}`
                      : milestone.submittedAt
                      ? `Submitted on ${new Date(milestone.submittedAt).toLocaleDateString()}`
                      : "Pending submission from freelancer"}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Freelancer Submit */}
                    {isFreelancer && (milestone.status === "PENDING" || milestone.status === "IN_PROGRESS") && (
                      <Button
                        size="sm"
                        disabled={actionLoading}
                        onClick={() => handleMilestoneAction(milestone.id, "submit")}
                        className="font-semibold text-xs"
                      >
                        Submit Deliverables
                      </Button>
                    )}

                    {/* Client Actions */}
                    {isClient && (
                      <>
                        {milestone.status === "PENDING" && (
                          <Button
                            size="sm"
                            disabled={actionLoading}
                            onClick={async () => {
                              setActionLoading(true);
                              try {
                                const res = await fetch(`/api/payments/milestones/${milestone.id}/fund`, { method: "POST" });
                                const data = await res.json();
                                setStatusFeedback(data.message || "Escrow funded");
                                await fetchWorkspace();
                              } catch (e: any) {
                                setStatusFeedback(e.message);
                              } finally {
                                setActionLoading(false);
                              }
                            }}
                            className="font-semibold text-xs bg-brand-600 hover:bg-brand-700 text-white"
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
                              className="font-semibold text-xs text-amber-700 border-amber-200"
                            >
                              Request Revision
                            </Button>
                            <Button
                              size="sm"
                              disabled={actionLoading}
                              onClick={async () => {
                                setActionLoading(true);
                                try {
                                  const res = await fetch(`/api/payments/milestones/${milestone.id}/release`, { method: "POST" });
                                  const data = await res.json();
                                  setStatusFeedback(data.message || "Payment released");
                                  await fetchWorkspace();
                                } catch (e: any) {
                                  setStatusFeedback(e.message);
                                } finally {
                                  setActionLoading(false);
                                }
                              }}
                              className="font-semibold text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
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

            {/* Review Section when COMPLETED */}
            {workspace.status === "COMPLETED" && (
              <Card className="p-6 bg-emerald-50/60 border border-emerald-200 shadow-card space-y-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <h3 className="text-base font-bold text-slate-900">Project Completed &amp; Escrow Released</h3>
                </div>
                <p className="text-xs text-slate-600">
                  All deliverables have been finalized and funds released. Leave a verified feedback review to endorse your counterparty.
                </p>
                <div className="pt-2">
                  <Button
                    size="sm"
                    onClick={async () => {
                      const comment = prompt("Enter your verified review comment (minimum 10 characters):");
                      if (!comment || comment.length < 10) return;
                      const rating = prompt("Enter rating score (1 to 5):", "5");
                      if (!rating) return;
                      try {
                        const res = await fetch(`/api/contracts/${workspace.id}/reviews`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ rating: parseInt(rating, 10), comment }),
                        });
                        const json = await res.json();
                        alert(json.message || json.error);
                      } catch (e: any) {
                        alert(e.message);
                      }
                    }}
                    className="font-semibold text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    Submit Verified Review
                  </Button>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Tab 2: Project Messages Chat */}
        {activeTab === "messages" && (
          <Card className="p-0 bg-white border-slate-200 shadow-card flex flex-col h-[520px]">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Encrypted Project Conversation</h3>
                <p className="text-[11px] text-slate-500">Only authorized contract participants can view and participate.</p>
              </div>
              <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Live Workspace
              </span>
            </div>

            {/* Message History */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-center text-slate-400 text-xs">
                  No messages yet. Send a greeting to initiate project collaboration.
                </div>
              ) : (
                messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex flex-col ${m.isSender ? "items-end" : "items-start"}`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 px-1">
                      <span className="text-[11px] font-bold text-slate-600">{m.senderName}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <div
                      className={`max-w-md p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                        m.isSender
                          ? "bg-brand-600 text-white rounded-br-none shadow-sm"
                          : "bg-slate-100 text-slate-800 rounded-bl-none"
                      }`}
                    >
                      {m.content}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-100 flex items-center gap-2">
              <Input
                placeholder="Type your project message or deliverable update..."
                className="flex-1 h-11"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
              <Button type="submit" disabled={sendingMessage || !newMessage.trim()} className="gap-1.5 font-semibold h-11">
                Send
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </Card>
        )}

        {/* Tab 3: Project Scope Overview */}
        {activeTab === "overview" && (
          <Card className="p-6 bg-white border-slate-200 shadow-card space-y-4">
            <h3 className="text-base font-bold text-slate-900">Project Description &amp; Scope</h3>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {workspace.job.description}
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
