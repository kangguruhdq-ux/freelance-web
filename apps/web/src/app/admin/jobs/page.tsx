"use client";

import * as React from "react";
import {
  Briefcase,
  Search,
  RefreshCw,
  Eye,
  Sliders,
  Trash2,
  X,
  User,
  DollarSign,
  FileText,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api-client";
import { formatCurrency } from "@/lib/utils";

interface JobItem {
  id: string;
  title: string;
  description: string;
  status: string;
  budget: number;
  budgetType: string;
  experienceLevel: string;
  locationType: string;
  category: string;
  client: { id: string; name: string; email: string; avatarUrl?: string };
  proposalsCount: number;
  contractsCount: number;
  createdAt: string;
}

export default function AdminJobsPage() {
  const [jobs, setJobs] = React.useState<JobItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [totalCount, setTotalCount] = React.useState(0);
  const [feedback, setFeedback] = React.useState<{ type: "success" | "error"; message: string } | null>(null);

  // Detail Modal
  const [selectedJob, setSelectedJob] = React.useState<any | null>(null);
  const [detailLoading, setDetailLoading] = React.useState(false);

  // Status Change Modal
  const [moderatingJob, setModeratingJob] = React.useState<JobItem | null>(null);
  const [newStatus, setNewStatus] = React.useState("OPEN");
  const [actionLoading, setActionLoading] = React.useState(false);

  const fetchJobs = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", "15");
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);

      const res = await apiFetch(`/admin/jobs?${params.toString()}`);
      if (res.success && res.data) {
        setJobs(res.data);
        if (res.pagination) {
          setTotalPages(res.pagination.totalPages || 1);
          setTotalCount(res.pagination.total || res.data.length);
        }
      } else {
        setFeedback({ type: "error", message: res.error || "Failed to load jobs" });
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message });
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  React.useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchJobs();
  };

  const openDetailModal = async (jobId: string) => {
    setDetailLoading(true);
    try {
      const res = await apiFetch(`/admin/jobs/${jobId}`);
      if (res.success && res.job) {
        setSelectedJob(res.job);
      } else {
        setFeedback({ type: "error", message: res.error || "Failed to load job details" });
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message });
    } finally {
      setDetailLoading(false);
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moderatingJob) return;

    try {
      setActionLoading(true);
      const res = await apiFetch(`/admin/jobs/${moderatingJob.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.success) {
        setFeedback({ type: "success", message: `Job status updated to ${newStatus}` });
        setModeratingJob(null);
        await fetchJobs();
      } else {
        setFeedback({ type: "error", message: res.error || "Failed to update job status" });
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteJob = async (job: JobItem) => {
    if (!window.confirm(`Are you sure you want to close/delete job "${job.title}"?`)) return;

    try {
      setActionLoading(true);
      const res = await apiFetch(`/admin/jobs/${job.id}`, {
        method: "DELETE",
      });

      if (res.success) {
        setFeedback({ type: "success", message: res.message || "Job removed or closed successfully" });
        await fetchJobs();
      } else {
        setFeedback({ type: "error", message: res.error || "Failed to delete job" });
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
            Marketplace Jobs Moderation
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Audit job listings, evaluate budgets, inspect proposals, and moderate status ({totalCount} total).
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchJobs}
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

      {/* Search & Filter */}
      <Card className="p-4 bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800/80 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          <div className="sm:col-span-8 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search jobs by title or description keywords..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs h-9 dark:bg-slate-800 dark:border-slate-700"
            />
          </div>

          <div className="sm:col-span-4">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              aria-label="Filter by job status"
              className="w-full text-xs h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-3 py-1.5 focus:outline-hidden"
            >
              <option value="">All Statuses (Open, In Progress, Closed...)</option>
              <option value="OPEN">OPEN</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="CANCELLED">CANCELLED</option>
              <option value="CLOSED">CLOSED</option>
              <option value="SUSPENDED">SUSPENDED</option>
            </select>
          </div>
        </form>
      </Card>

      {/* Jobs Table */}
      <Card className="bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-400">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-5 py-3.5">Job Title &amp; Category</th>
                <th className="px-4 py-3.5">Client</th>
                <th className="px-4 py-3.5">Budget</th>
                <th className="px-4 py-3.5">Bids / Contracts</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-brand-600" />
                    Loading job listings...
                  </td>
                </tr>
              ) : jobs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    No jobs match the search criteria.
                  </td>
                </tr>
              ) : (
                jobs.map((j) => (
                  <tr key={j.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-3.5 max-w-xs">
                      <p className="font-bold text-slate-900 dark:text-slate-100 truncate">
                        {j.title}
                      </p>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {j.category} • {j.experienceLevel}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {j.client.name}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">{j.client.email}</p>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="font-black text-slate-900 dark:text-slate-100">
                        {formatCurrency(j.budget)}
                      </span>
                      <span className="block text-[10px] text-slate-400 uppercase font-bold">
                        {j.budgetType}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {j.proposalsCount} proposals
                      </span>
                      <span className="block text-[10px] text-slate-400">
                        {j.contractsCount} contracts
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <Badge
                        variant={
                          j.status === "OPEN"
                            ? "success"
                            : j.status === "IN_PROGRESS"
                            ? "default"
                            : j.status === "SUSPENDED"
                            ? "destructive"
                            : "secondary"
                        }
                        className="text-[10px] font-bold"
                      >
                        {j.status}
                      </Badge>
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDetailModal(j.id)}
                          className="h-7 px-2 text-[11px] font-semibold dark:border-slate-800"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setModeratingJob(j);
                            setNewStatus(j.status);
                          }}
                          className="h-7 px-2 text-[11px] font-semibold dark:border-slate-800"
                        >
                          <Sliders className="h-3 w-3 mr-1" />
                          Moderate
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteJob(j)}
                          className="h-7 px-2 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border-rose-200 dark:border-rose-900/60"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-3.5 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between">
            <p className="text-xs text-slate-400">
              Page <span className="font-bold text-slate-700 dark:text-slate-300">{page}</span> of{" "}
              <span className="font-bold text-slate-700 dark:text-slate-300">{totalPages}</span>
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="text-xs h-7 px-2.5 dark:border-slate-800"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="text-xs h-7 px-2.5 dark:border-slate-800"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* View Job Detail Modal */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <Card className="w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-[10px]">
                    {selectedJob.category}
                  </Badge>
                  <Badge variant="secondary" className="text-[10px]">
                    {selectedJob.status}
                  </Badge>
                </div>
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  {selectedJob.title}
                </h2>
              </div>
              <button
                onClick={() => setSelectedJob(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold">Budget</span>
                <p className="text-xs font-black text-slate-900 dark:text-white">
                  {formatCurrency(selectedJob.budget)} ({selectedJob.budgetType})
                </p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold">Experience</span>
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  {selectedJob.experienceLevel}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold">Client</span>
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {selectedJob.client.name}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold">Posted On</span>
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  {new Date(selectedJob.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                Description
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line bg-slate-50 dark:bg-slate-800/30 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                {selectedJob.description}
              </p>
            </div>

            {selectedJob.skills && selectedJob.skills.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  Required Skills
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {selectedJob.skills.map((s: any) => (
                    <Badge key={s.id} variant="secondary" className="text-[11px]">
                      {s.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {selectedJob.proposals && (
              <div>
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
                  Proposals Received ({selectedJob.proposals.length})
                </h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedJob.proposals.map((p: any) => (
                    <div
                      key={p.id}
                      className="p-3 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-slate-900 dark:text-white">
                            {p.freelancer.name}
                          </span>
                          <Badge variant="outline" className="text-[10px]">
                            {p.status}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-2">{p.coverLetter}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-black text-slate-900 dark:text-white">
                          {formatCurrency(p.bidAmount)}
                        </span>
                        <span className="block text-[10px] text-slate-400">
                          in {p.estimatedDays} days
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-3 flex justify-end border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedJob(null)}
                className="text-xs h-8 dark:border-slate-800"
              >
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Moderate Status Modal */}
      {moderatingJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <Card className="w-full max-w-sm p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Moderate Job Status
              </h2>
              <button
                onClick={() => setModeratingJob(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateStatus} className="space-y-4">
              <div>
                <p className="text-xs text-slate-500 mb-2 font-medium">
                  Select new status for <strong>&ldquo;{moderatingJob.title}&rdquo;</strong>:
                </p>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full text-xs h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-3 py-1.5 focus:outline-hidden"
                >
                  <option value="OPEN">OPEN (Accepting proposals)</option>
                  <option value="IN_PROGRESS">IN_PROGRESS (Contract ongoing)</option>
                  <option value="COMPLETED">COMPLETED (Deliverables approved)</option>
                  <option value="CLOSED">CLOSED (No longer hiring)</option>
                  <option value="SUSPENDED">SUSPENDED (Moderated / Policy violation)</option>
                  <option value="CANCELLED">CANCELLED (Withdrawn by client)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setModeratingJob(null)}
                  className="text-xs h-8 dark:border-slate-800"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={actionLoading}
                  className="bg-brand-600 hover:bg-brand-700 text-white text-xs h-8"
                >
                  {actionLoading ? "Updating..." : "Update Status"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
