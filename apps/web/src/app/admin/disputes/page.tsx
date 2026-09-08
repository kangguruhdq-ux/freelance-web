"use client";

import * as React from "react";
import {
  Scale,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  X,
  DollarSign,
  User,
  FileCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { apiFetch } from "@/lib/api-client";
import { formatCurrency } from "@/lib/utils";

interface DisputeItem {
  id: string;
  reason: string;
  description: string;
  status: string;
  resolution?: string;
  createdAt: string;
  openedBy: { id: string; name: string; email: string };
  resolvedBy?: { id: string; name: string };
  contract: {
    id: string;
    title: string;
    contractNumber: string;
    totalAmount: number;
    escrowBalance: number;
    client: { id: string; name: string };
    freelancer: { id: string; name: string };
  };
}

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = React.useState<DisputeItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [statusFilter, setStatusFilter] = React.useState("ALL");
  const [feedback, setFeedback] = React.useState<{ type: "success" | "error"; message: string } | null>(null);

  // Mediation modal
  const [resolvingDispute, setResolvingDispute] = React.useState<DisputeItem | null>(null);
  const [newStatus, setNewStatus] = React.useState("RESOLVED");
  const [resolutionText, setResolutionText] = React.useState("");
  const [actionLoading, setActionLoading] = React.useState(false);

  const fetchDisputes = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/admin/disputes");
      if (res.success && res.data) {
        setDisputes(res.data);
      } else {
        setFeedback({ type: "error", message: res.error || "Failed to load disputes" });
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message });
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchDisputes();
  }, [fetchDisputes]);

  const filteredDisputes = React.useMemo(() => {
    if (statusFilter === "ALL") return disputes;
    return disputes.filter((d) => d.status === statusFilter);
  }, [disputes, statusFilter]);

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingDispute) return;
    if (!resolutionText || resolutionText.trim().length < 10) {
      setFeedback({ type: "error", message: "Resolution explanation must be at least 10 characters." });
      return;
    }

    try {
      setActionLoading(true);
      const res = await apiFetch(`/admin/disputes/${resolvingDispute.id}/resolve`, {
        method: "PATCH",
        body: JSON.stringify({
          status: newStatus,
          resolution: resolutionText.trim(),
        }),
      });

      if (res.success) {
        setFeedback({
          type: "success",
          message: `Dispute marked as ${newStatus} successfully.`,
        });
        setResolvingDispute(null);
        setResolutionText("");
        await fetchDisputes();
      } else {
        setFeedback({ type: "error", message: res.error || "Failed to resolve dispute" });
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/80 dark:border-slate-800/80">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Dispute Mediation Console
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Independent administrative mediation for contractual impasses, escrow disputes, and scope disagreements.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchDisputes}
          className="text-xs font-semibold dark:border-slate-800 self-start sm:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-medium flex items-center justify-between ${
            feedback.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
              : "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300"
          }`}
        >
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="underline font-bold text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 dark:border-slate-800/80">
        {["ALL", "OPEN", "UNDER_REVIEW", "RESOLVED"].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition-all ${
              statusFilter === status
                ? "border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            {status} ({disputes.filter((d) => status === "ALL" || d.status === status).length})
          </button>
        ))}
      </div>

      {/* Disputes List */}
      {loading ? (
        <div className="py-12 text-center text-slate-400">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-brand-600" />
          Loading dispute queue...
        </div>
      ) : filteredDisputes.length === 0 ? (
        <Card className="p-12 text-center bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800/80 shadow-xs">
          <CheckCircle className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
            No disputes requiring mediation
          </p>
          <p className="text-xs text-slate-400 mt-0.5">All contractual terms currently respected.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredDisputes.map((d) => (
            <Card
              key={d.id}
              className="p-6 bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <Badge
                      variant={
                        d.status === "OPEN"
                          ? "destructive"
                          : d.status === "UNDER_REVIEW"
                          ? "warning"
                          : "success"
                      }
                      className="text-[10px] font-bold"
                    >
                      {d.status}
                    </Badge>
                    <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-400">
                      Contract #{d.contract?.contractNumber}
                    </span>
                    <span className="text-xs text-slate-400">
                      • Opened {new Date(d.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                    {d.reason}
                  </h2>

                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Raised by {d.openedBy?.name} ({d.openedBy?.email})
                  </p>
                </div>

                {d.status !== "RESOLVED" && (
                  <Button
                    size="sm"
                    onClick={() => {
                      setResolvingDispute(d);
                      setNewStatus("RESOLVED");
                      setResolutionText(
                        "Administrator reviewed evidence and contract milestones. Settlement finalized."
                      );
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 font-semibold shrink-0"
                  >
                    Mediate &amp; Resolve
                  </Button>
                )}
              </div>

              {/* Dispute Metadata Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Contract</span>
                  <p className="font-bold text-slate-800 dark:text-slate-200 truncate">
                    {d.contract?.title}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Client</span>
                  <p className="font-bold text-slate-800 dark:text-slate-200 truncate">
                    {d.contract?.client?.name}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Freelancer</span>
                  <p className="font-bold text-slate-800 dark:text-slate-200 truncate">
                    {d.contract?.freelancer?.name}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">
                    Escrow Balance
                  </span>
                  <p className="font-black text-rose-600 dark:text-rose-400">
                    {formatCurrency(d.contract?.escrowBalance || 0)}
                  </p>
                </div>
              </div>

              <div>
                <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Claim Details
                </span>
                <p className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                  {d.description}
                </p>
              </div>

              {d.resolution && (
                <div className="p-3.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900 text-xs text-emerald-900 dark:text-emerald-200">
                  <span className="font-bold uppercase tracking-wider text-[10px] text-emerald-700 dark:text-emerald-400 block mb-1">
                    Mediator Resolution Ruling {d.resolvedBy && `(by ${d.resolvedBy.name})`}
                  </span>
                  {d.resolution}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Mediation Resolution Modal */}
      {resolvingDispute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <Card className="w-full max-w-lg p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Issue Mediation Decision
                </h2>
                <p className="text-[11px] text-slate-400">
                  Contract #{resolvingDispute.contract?.contractNumber}
                </p>
              </div>
              <button
                onClick={() => setResolvingDispute(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleResolveSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Dispute Status Transition
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full text-xs h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-3 py-1.5 focus:outline-hidden"
                >
                  <option value="RESOLVED">RESOLVED (Finalized &amp; closed)</option>
                  <option value="UNDER_REVIEW">UNDER_REVIEW (Investigation in progress)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Mediator Resolution Findings (Min 10 chars)
                </label>
                <textarea
                  required
                  rows={4}
                  value={resolutionText}
                  onChange={(e) => setResolutionText(e.target.value)}
                  placeholder="Detail the factual findings, escrow disbursement instructions, and final judgment..."
                  className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 p-2.5 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setResolvingDispute(null)}
                  className="text-xs h-8 dark:border-slate-800"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={actionLoading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8"
                >
                  {actionLoading ? "Submitting..." : "Finalize Ruling"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
