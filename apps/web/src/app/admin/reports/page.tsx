"use client";

import * as React from "react";
import {
  ShieldAlert,
  Search,
  RefreshCw,
  CheckCircle,
  XCircle,
  X,
  User,
  AlertTriangle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { apiFetch } from "@/lib/api-client";

interface ReportItem {
  id: string;
  targetType: string;
  targetId: string;
  reason: string;
  description: string;
  status: string;
  resolutionNotes?: string;
  createdAt: string;
  reporter: { id: string; name: string; email: string };
  resolvedBy?: { id: string; name: string };
}

export default function AdminReportsPage() {
  const [reports, setReports] = React.useState<ReportItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [statusFilter, setStatusFilter] = React.useState("ALL");
  const [feedback, setFeedback] = React.useState<{ type: "success" | "error"; message: string } | null>(null);

  // Resolution modal
  const [resolvingReport, setResolvingReport] = React.useState<ReportItem | null>(null);
  const [resolutionNotes, setResolutionNotes] = React.useState("");
  const [actionLoading, setActionLoading] = React.useState(false);

  const fetchReports = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/admin/reports");
      if (res.success && res.data) {
        setReports(res.data);
      } else {
        setFeedback({ type: "error", message: res.error || "Failed to load reports" });
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message });
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const filteredReports = React.useMemo(() => {
    if (statusFilter === "ALL") return reports;
    return reports.filter((r) => r.status === statusFilter);
  }, [reports, statusFilter]);

  const handleResolveSubmit = async (e: React.FormEvent, status: "RESOLVED" | "DISMISSED") => {
    e.preventDefault();
    if (!resolvingReport) return;

    try {
      setActionLoading(true);
      const res = await apiFetch(`/admin/reports/${resolvingReport.id}/resolve`, {
        method: "PATCH",
        body: JSON.stringify({
          status,
          resolutionNotes: resolutionNotes || `Report ${status.toLowerCase()} by administrator.`,
        }),
      });

      if (res.success) {
        setFeedback({
          type: "success",
          message: `Report has been ${status.toLowerCase()} successfully.`,
        });
        setResolvingReport(null);
        setResolutionNotes("");
        await fetchReports();
      } else {
        setFeedback({ type: "error", message: res.error || "Failed to update report" });
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
            Moderation &amp; Safety Queue
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Review user-submitted violation reports, enforce platform community guidelines, and resolve flags.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchReports}
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
        {["ALL", "OPEN", "RESOLVED", "DISMISSED"].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition-all ${
              statusFilter === status
                ? "border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            {status} ({reports.filter((r) => status === "ALL" || r.status === status).length})
          </button>
        ))}
      </div>

      {/* Reports List */}
      {loading ? (
        <div className="py-12 text-center text-slate-400">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-brand-600" />
          Loading reports...
        </div>
      ) : filteredReports.length === 0 ? (
        <Card className="p-12 text-center bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800/80 shadow-xs">
          <CheckCircle className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Zero pending reports in this queue
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            Community reports are completely up to date.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredReports.map((report) => (
            <Card
              key={report.id}
              className="p-5 bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <Badge variant="outline" className="text-[10px] font-bold uppercase">
                      Target: {report.targetType}
                    </Badge>
                    <Badge
                      variant={
                        report.status === "OPEN"
                          ? "warning"
                          : report.status === "RESOLVED"
                          ? "success"
                          : "secondary"
                      }
                      className="text-[10px] font-bold"
                    >
                      {report.status}
                    </Badge>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Target ID: {report.targetId.slice(0, 10)}...
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {report.reason}
                  </h3>

                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Reported by {report.reporter?.name} ({report.reporter?.email}) on{" "}
                    {new Date(report.createdAt).toLocaleDateString()}
                  </p>
                </div>

                {report.status === "OPEN" && (
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      onClick={() => {
                        setResolvingReport(report);
                        setResolutionNotes("Content audited and approved/sanctioned.");
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 font-semibold"
                    >
                      Resolve
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setResolvingReport(report);
                        setResolutionNotes("Dismissed as false report / not a violation.");
                      }}
                      className="text-xs h-8 font-semibold dark:border-slate-800"
                    >
                      Dismiss
                    </Button>
                  </div>
                )}
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {report.description}
              </div>

              {report.resolutionNotes && (
                <div className="p-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 text-[11px] text-emerald-800 dark:text-emerald-300">
                  <strong>Resolution:</strong> {report.resolutionNotes}
                  {report.resolvedBy && ` (by ${report.resolvedBy.name})`}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Resolution Modal */}
      {resolvingReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <Card className="w-full max-w-md p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Review &amp; Conclude Report
              </h2>
              <button
                onClick={() => setResolvingReport(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Resolution Notes
                </label>
                <textarea
                  rows={3}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="State the administrative finding and actions taken..."
                  className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 p-2.5 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setResolvingReport(null)}
                  className="text-xs h-8 dark:border-slate-800"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={actionLoading}
                  onClick={(e) => handleResolveSubmit(e, "DISMISSED")}
                  className="text-xs h-8 bg-slate-600 hover:bg-slate-700 text-white"
                >
                  Dismiss Flag
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={actionLoading}
                  onClick={(e) => handleResolveSubmit(e, "RESOLVED")}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8"
                >
                  Confirm Resolved
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
