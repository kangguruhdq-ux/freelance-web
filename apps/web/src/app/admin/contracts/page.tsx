"use client";

import * as React from "react";
import {
  FileCheck,
  Search,
  RefreshCw,
  Eye,
  Sliders,
  X,
  ShieldCheck,
  DollarSign,
  Layers,
  Calendar,
  ExternalLink,
  Download,
  Paperclip,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { apiFetch } from "@/lib/api-client";
import { formatCurrency } from "@/lib/utils";

interface ContractItem {
  id: string;
  contractNumber: string;
  title: string;
  totalAmount: number;
  escrowBalance: number;
  status: string;
  client: { id: string; name: string; email: string; avatarUrl?: string | null };
  freelancer: { id: string; name: string; email: string; avatarUrl?: string | null };
  milestonesCount: number;
  messagesCount: number;
  createdAt: string;
}

export default function AdminContractsPage() {
  const [contracts, setContracts] = React.useState<ContractItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [totalCount, setTotalCount] = React.useState(0);
  const [feedback, setFeedback] = React.useState<{ type: "success" | "error"; message: string } | null>(null);

  // Detail Modal
  const [selectedContract, setSelectedContract] = React.useState<any | null>(null);
  const [detailLoading, setDetailLoading] = React.useState(false);

  // Status Override Modal
  const [moderatingContract, setModeratingContract] = React.useState<ContractItem | null>(null);
  const [newStatus, setNewStatus] = React.useState("ACTIVE");
  const [actionLoading, setActionLoading] = React.useState(false);

  const fetchContracts = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", "15");
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);

      const res = await apiFetch(`/admin/contracts?${params.toString()}`);
      if (res.success && res.data) {
        setContracts(res.data);
        if (res.pagination) {
          setTotalPages(res.pagination.totalPages || 1);
          setTotalCount(res.pagination.total || res.data.length);
        }
      } else {
        setFeedback({ type: "error", message: res.error || "Failed to load contracts" });
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message });
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  React.useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchContracts();
  };

  const openDetailModal = async (id: string) => {
    setDetailLoading(true);
    try {
      const res = await apiFetch(`/admin/contracts/${id}`);
      if (res.success && res.contract) {
        setSelectedContract(res.contract);
      } else {
        setFeedback({ type: "error", message: res.error || "Failed to fetch contract detail" });
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message });
    } finally {
      setDetailLoading(false);
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moderatingContract) return;

    try {
      setActionLoading(true);
      const res = await apiFetch(`/admin/contracts/${moderatingContract.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.success) {
        setFeedback({ type: "success", message: `Contract status updated to ${newStatus}` });
        setModeratingContract(null);
        await fetchContracts();
      } else {
        setFeedback({ type: "error", message: res.error || "Failed to update status" });
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
            Contracts &amp; Escrow Governance
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Monitor escrow balances, verify milestones, and govern contractual agreements ({totalCount} total).
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchContracts}
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
              placeholder="Search by contract number, title, client, or freelancer..."
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
              aria-label="Filter by contract status"
              className="w-full text-xs h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-3 py-1.5 focus:outline-hidden"
            >
              <option value="">All Statuses (Active, Completed, Disputed...)</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="TERMINATED">TERMINATED</option>
              <option value="DISPUTED">DISPUTED</option>
            </select>
          </div>
        </form>
      </Card>

      {/* Contracts Table */}
      <Card className="bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-400">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-5 py-3.5">Contract # &amp; Title</th>
                <th className="px-4 py-3.5">Parties</th>
                <th className="px-4 py-3.5">Total Value</th>
                <th className="px-4 py-3.5">Escrow Balance</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-brand-600" />
                    Loading contracts...
                  </td>
                </tr>
              ) : contracts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    No contracts found matching the criteria.
                  </td>
                </tr>
              ) : (
                contracts.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-3.5 max-w-xs">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <Badge variant="outline" className="font-mono text-[10px]">
                          #{c.contractNumber}
                        </Badge>
                        <span className="text-[11px] text-slate-400">
                          {c.milestonesCount} milestones
                        </span>
                      </div>
                      <p className="font-bold text-slate-900 dark:text-slate-100 truncate">
                        {c.title}
                      </p>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Avatar
                          src={c.client.avatarUrl}
                          fallback={c.client.name}
                          size="xs"
                        />
                        <span className="text-slate-800 dark:text-slate-200 font-semibold truncate text-xs">
                          {c.client.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Avatar
                          src={c.freelancer.avatarUrl}
                          fallback={c.freelancer.name}
                          size="xs"
                        />
                        <span className="text-slate-500 text-[11px] truncate">
                          {c.freelancer.name}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 font-black text-slate-900 dark:text-slate-100">
                      {formatCurrency(c.totalAmount)}
                    </td>

                    <td className="px-4 py-3.5 font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(c.escrowBalance)}
                    </td>

                    <td className="px-4 py-3.5">
                      <Badge
                        variant={
                          c.status === "ACTIVE"
                            ? "default"
                            : c.status === "COMPLETED"
                            ? "success"
                            : c.status === "DISPUTED"
                            ? "destructive"
                            : "secondary"
                        }
                        className="text-[10px] font-bold"
                      >
                        {c.status}
                      </Badge>
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDetailModal(c.id)}
                          className="h-7 px-2 text-[11px] font-semibold dark:border-slate-800"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setModeratingContract(c);
                            setNewStatus(c.status);
                          }}
                          className="h-7 px-2 text-[11px] font-semibold dark:border-slate-800"
                        >
                          <Sliders className="h-3 w-3 mr-1" />
                          Override
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

      {/* Contract Detail Modal */}
      {selectedContract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <Card className="w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="font-mono text-[10px]">
                    #{selectedContract.contractNumber}
                  </Badge>
                  <Badge variant="secondary" className="text-[10px]">
                    {selectedContract.status}
                  </Badge>
                </div>
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                  {selectedContract.title}
                </h2>
              </div>
              <button
                onClick={() => setSelectedContract(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold">Total Budget</span>
                <p className="text-xs font-black text-slate-900 dark:text-white">
                  {formatCurrency(selectedContract.totalAmount)}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold">Escrow Collateral</span>
                <p className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(selectedContract.escrowBalance)}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold">Client</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Avatar
                    src={selectedContract.client?.avatarUrl}
                    fallback={selectedContract.client?.name || "Client"}
                    size="xs"
                  />
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {selectedContract.client?.name}
                  </p>
                </div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold">Freelancer</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Avatar
                    src={selectedContract.freelancer?.avatarUrl}
                    fallback={selectedContract.freelancer?.name || "Freelancer"}
                    size="xs"
                  />
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {selectedContract.freelancer?.name}
                  </p>
                </div>
              </div>
            </div>

            {selectedContract.milestones && (
              <div>
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
                  Contract Milestones ({selectedContract.milestones.length})
                </h3>
                <div className="space-y-2">
                  {selectedContract.milestones.map((m: any, idx: number) => {
                    const urlMatch = m.description ? m.description.match(/(https?:\/\/[^\s]+)/) : null;
                    const workUrl = urlMatch ? urlMatch[0] : null;

                    return (
                      <div
                        key={m.id}
                        className="p-3 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-bold text-slate-900 dark:text-white">
                              #{idx + 1} {m.title}
                            </span>
                            <Badge variant="outline" className="text-[10px]">
                              {m.status}
                            </Badge>
                          </div>
                          <span className="font-black text-slate-900 dark:text-white">
                            {formatCurrency(m.amount)}
                          </span>
                        </div>

                        {m.description && (
                          <p className="text-[11px] text-slate-500 whitespace-pre-line leading-relaxed">
                            {m.description}
                          </p>
                        )}

                        {/* Deliverable Project URL if submitted */}
                        {workUrl && (
                          <div className="pt-1">
                            <a
                              href={workUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/60 dark:hover:bg-brand-900/60 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 transition"
                            >
                              <ExternalLink className="h-3 w-3" />
                              <span>Live Work URL: {workUrl}</span>
                            </a>
                          </div>
                        )}

                        {/* Deliverable Attachments if any */}
                        {m.attachments && m.attachments.length > 0 && (
                          <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800 space-y-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase">
                              Deliverable Files ({m.attachments.length})
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {m.attachments.map((att: any) => (
                                <a
                                  key={att.id}
                                  href={att.fileUrl}
                                  download={att.fileName}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[11px] text-slate-700 dark:text-slate-300 transition"
                                >
                                  <Paperclip className="h-3 w-3 text-brand-500" />
                                  <span className="truncate max-w-[140px]">{att.fileName}</span>
                                  <Download className="h-3 w-3 text-slate-400" />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="pt-3 flex justify-end border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedContract(null)}
                className="text-xs h-8 dark:border-slate-800"
              >
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Override Status Modal */}
      {moderatingContract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <Card className="w-full max-w-sm p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Admin Status Override
              </h2>
              <button
                onClick={() => setModeratingContract(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateStatus} className="space-y-4">
              <div>
                <p className="text-xs text-slate-500 mb-2 font-medium">
                  Override status for contract <strong>#{moderatingContract.contractNumber}</strong>:
                </p>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full text-xs h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-3 py-1.5 focus:outline-hidden"
                >
                  <option value="ACTIVE">ACTIVE (Contract ongoing)</option>
                  <option value="COMPLETED">COMPLETED (All milestones finalized)</option>
                  <option value="TERMINATED">TERMINATED (Cancelled prematurely)</option>
                  <option value="DISPUTED">DISPUTED (Locked for mediation)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setModeratingContract(null)}
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
                  {actionLoading ? "Updating..." : "Save Override"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
