"use client";

import * as React from "react";
import {
  Receipt,
  DollarSign,
  RefreshCw,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  Percent,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { apiFetch } from "@/lib/api-client";
import { formatCurrency } from "@/lib/utils";

interface TransactionItem {
  id: string;
  transactionNumber: string;
  type: string;
  status: string;
  amount: number;
  fee: number;
  net: number;
  description: string;
  user: { id: string; name: string; email: string; role: string };
  contract?: { id: string; contractNumber: string; title: string };
  createdAt: string;
}

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = React.useState<TransactionItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [typeFilter, setTypeFilter] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [totalCount, setTotalCount] = React.useState(0);
  const [feedback, setFeedback] = React.useState<string | null>(null);

  const fetchTransactions = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", "20");
      if (typeFilter) params.set("type", typeFilter);
      if (statusFilter) params.set("status", statusFilter);

      const res = await apiFetch(`/admin/transactions?${params.toString()}`);
      if (res.success && res.data) {
        setTransactions(res.data);
        if (res.pagination) {
          setTotalPages(res.pagination.totalPages || 1);
          setTotalCount(res.pagination.total || res.data.length);
        }
      } else {
        setFeedback(res.error || "Failed to load transactions");
      }
    } catch (err: any) {
      setFeedback(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, typeFilter, statusFilter]);

  React.useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Aggregate metrics
  const totalVolume = transactions.reduce((acc, t) => acc + (t.status === "COMPLETED" ? t.amount : 0), 0);
  const totalFees = transactions.reduce((acc, t) => acc + (t.status === "COMPLETED" ? t.fee : 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/80 dark:border-slate-800/80">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Financial Ledger &amp; Platform Fees
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Immutable audit record of escrow deposits, milestone releases, refunds, and 10% platform cuts ({totalCount} total).
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchTransactions}
          className="text-xs font-semibold dark:border-slate-800 self-start sm:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
          Refresh Ledger
        </Button>
      </div>

      {feedback && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs font-medium flex items-center justify-between">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="underline font-bold text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800/80 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Page Volume
            </span>
            <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-xl font-black text-slate-900 dark:text-white">
            {formatCurrency(totalVolume)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Processed transactions</p>
        </Card>

        <Card className="p-4 bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800/80 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Platform Cut (10%)
            </span>
            <Percent className="h-4 w-4 text-brand-600 dark:text-brand-400" />
          </div>
          <p className="text-xl font-black text-brand-600 dark:text-brand-400">
            {formatCurrency(totalFees)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Gross platform margin</p>
        </Card>

        <Card className="p-4 bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800/80 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Security Protocol
            </span>
            <ShieldCheck className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <p className="text-xl font-black text-slate-900 dark:text-white">
            100% Escrow
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Zero uncovered liabilities</p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4 bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800/80 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Transaction Type
            </label>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              aria-label="Filter by transaction type"
              className="w-full text-xs h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-3 py-1.5 focus:outline-hidden"
            >
              <option value="">All Types (Escrow, Release, Refund...)</option>
              <option value="ESCROW_DEPOSIT">ESCROW_DEPOSIT</option>
              <option value="RELEASE">RELEASE (Milestone Payout)</option>
              <option value="REFUND">REFUND</option>
              <option value="PLATFORM_FEE">PLATFORM_FEE</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Settlement Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              aria-label="Filter by settlement status"
              className="w-full text-xs h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-3 py-1.5 focus:outline-hidden"
            >
              <option value="">All Statuses (Completed, Pending, Failed...)</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="PENDING">PENDING</option>
              <option value="FAILED">FAILED</option>
              <option value="REFUNDED">REFUNDED</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Ledger Table */}
      <Card className="bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-400">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-5 py-3.5">Reference &amp; Date</th>
                <th className="px-4 py-3.5">Account / Contract</th>
                <th className="px-4 py-3.5">Type</th>
                <th className="px-4 py-3.5">Gross Amount</th>
                <th className="px-4 py-3.5">Fee (10%)</th>
                <th className="px-4 py-3.5">Net Payout</th>
                <th className="px-5 py-3.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-brand-600" />
                    Loading financial ledger...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                    No transactions recorded matching the criteria.
                  </td>
                </tr>
              ) : (
                transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-mono font-bold text-slate-900 dark:text-slate-100">
                        #{t.transactionNumber}
                      </p>
                      <span className="text-[11px] text-slate-400">
                        {new Date(t.createdAt).toLocaleString()}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {t.user.name} ({t.user.role})
                      </p>
                      {t.contract && (
                        <p className="text-[11px] text-slate-400 truncate">
                          Contract #{t.contract.contractNumber}
                        </p>
                      )}
                    </td>

                    <td className="px-4 py-3.5">
                      <Badge
                        variant={
                          t.type === "RELEASE"
                            ? "success"
                            : t.type === "ESCROW_DEPOSIT"
                            ? "default"
                            : "secondary"
                        }
                        className="text-[10px] font-bold"
                      >
                        {t.type}
                      </Badge>
                    </td>

                    <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-slate-100">
                      {formatCurrency(t.amount)}
                    </td>

                    <td className="px-4 py-3.5 text-brand-600 dark:text-brand-400 font-bold">
                      {t.fee > 0 ? formatCurrency(t.fee) : "—"}
                    </td>

                    <td className="px-4 py-3.5 font-black text-slate-900 dark:text-slate-100">
                      {formatCurrency(t.net)}
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <Badge
                        variant={t.status === "COMPLETED" ? "success" : "warning"}
                        className="text-[10px] font-bold"
                      >
                        {t.status}
                      </Badge>
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
    </div>
  );
}
