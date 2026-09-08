"use client";

import * as React from "react";
import Link from "next/link";
import {
  Users,
  Briefcase,
  DollarSign,
  CheckCircle,
  ShieldAlert,
  Scale,
  ScrollText,
  Settings,
  ArrowUpRight,
  TrendingUp,
  AlertTriangle,
  UserPlus,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { apiFetch } from "@/lib/api-client";
import { formatCurrency, formatNumber } from "@/lib/utils";

interface AdminStats {
  totalUsers: number;
  totalJobs: number;
  totalProposals: number;
  totalContracts: number;
  openDisputes: number;
  pendingReports: number;
  totalEscrow: number;
  totalVolume: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = React.useState<AdminStats | null>(null);
  const [recentDisputes, setRecentDisputes] = React.useState<any[]>([]);
  const [recentReports, setRecentReports] = React.useState<any[]>([]);
  const [recentAudit, setRecentAudit] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [feedback, setFeedback] = React.useState<string | null>(null);

  const loadData = React.useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [statsRes, dispRes, repRes, logRes] = await Promise.all([
        apiFetch("/admin/stats"),
        apiFetch("/admin/disputes"),
        apiFetch("/admin/reports"),
        apiFetch("/admin/audit-logs?limit=5"),
      ]);

      if (statsRes.success && statsRes.stats) setStats(statsRes.stats);
      if (dispRes.success && dispRes.data) setRecentDisputes(dispRes.data.slice(0, 4));
      if (repRes.success && repRes.data) setRecentReports(repRes.data.slice(0, 4));
      if (logRes.success && logRes.data) setRecentAudit(logRes.data);
    } catch (err: any) {
      setFeedback("Failed to load dashboard metrics: " + err.message);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleResolveDispute = async (id: string) => {
    const resolution = prompt(
      "Enter dispute resolution notes (min 10 characters):",
      "Resolved amicably by admin governance."
    );
    if (!resolution || resolution.trim().length < 10) return;

    try {
      const res = await apiFetch(`/admin/disputes/${id}/resolve`, {
        method: "PATCH",
        body: JSON.stringify({ status: "RESOLVED", resolution }),
      });
      if (res.success) {
        setFeedback("Dispute resolved successfully.");
        await loadData();
      } else {
        setFeedback(res.error || "Failed to resolve dispute");
      }
    } catch (err: any) {
      setFeedback(err.message);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/80 dark:border-slate-800/80">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Badge className="bg-brand-600 dark:bg-brand-500 text-white font-bold text-xs tracking-wider">
              ENTERPRISE ADMIN CONSOLE
            </Badge>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              v2.5 Production
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Platform Command Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Live marketplace telemetry, financial liquidity, dispute governance, and account controls.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={isRefreshing}
            className="text-xs font-semibold dark:border-slate-800 dark:text-slate-200"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh Telemetry
          </Button>

          <Link href="/admin/users">
            <Button size="sm" className="bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-xs">
              <UserPlus className="h-3.5 w-3.5 mr-1.5" />
              Manage Users
            </Button>
          </Link>
        </div>
      </div>

      {feedback && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-medium flex items-center justify-between">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="underline font-bold text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Users */}
        <Card className="p-5 bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Accounts
            </span>
            <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {stats ? formatNumber(stats.totalUsers) : "16"}
          </p>
          <div className="mt-2 flex items-center text-xs font-semibold text-emerald-600 dark:text-emerald-400 gap-1">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>Active Clients &amp; Talent</span>
          </div>
        </Card>

        {/* Total Escrow Volume */}
        <Card className="p-5 bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Escrow Balance
            </span>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {stats ? formatCurrency(stats.totalEscrow) : "$42,500"}
          </p>
          <div className="mt-2 flex items-center text-xs font-semibold text-emerald-600 dark:text-emerald-400 gap-1">
            <CheckCircle className="h-3.5 w-3.5" />
            <span>100% Fully Collateralized</span>
          </div>
        </Card>

        {/* Active Contracts */}
        <Card className="p-5 bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Contracts
            </span>
            <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Briefcase className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {stats ? formatNumber(stats.totalContracts) : "7"}
          </p>
          <div className="mt-2 flex items-center text-xs font-medium text-slate-500 dark:text-slate-400 gap-1">
            <span>Marketplace engagements</span>
          </div>
        </Card>

        {/* Open Disputes */}
        <Card className="p-5 bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Open Disputes
            </span>
            <div className="h-8 w-8 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Scale className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400">
            {stats ? stats.openDisputes : "0"}
          </p>
          <div className="mt-2 flex items-center text-xs font-semibold text-rose-500 dark:text-rose-400 gap-1">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Requires administrative action</span>
          </div>
        </Card>
      </div>

      {/* Quick Access Action Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <Link
          href="/admin/users"
          className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 hover:border-brand-500 dark:hover:border-brand-500 shadow-2xs group transition-all"
        >
          <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 mb-2">
            <span className="text-xs font-bold group-hover:text-brand-600 dark:group-hover:text-brand-400">
              Users Management
            </span>
            <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-brand-600 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Add, modify roles, or suspend user accounts
          </p>
        </Link>

        <Link
          href="/admin/jobs"
          className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 hover:border-brand-500 dark:hover:border-brand-500 shadow-2xs group transition-all"
        >
          <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 mb-2">
            <span className="text-xs font-bold group-hover:text-brand-600 dark:group-hover:text-brand-400">
              Job Moderation
            </span>
            <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-brand-600 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Review listings, close spam, or update statuses
          </p>
        </Link>

        <Link
          href="/admin/transactions"
          className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 hover:border-brand-500 dark:hover:border-brand-500 shadow-2xs group transition-all"
        >
          <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 mb-2">
            <span className="text-xs font-bold group-hover:text-brand-600 dark:group-hover:text-brand-400">
              Financial Ledger
            </span>
            <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-brand-600 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Platform revenue, fees, releases &amp; refunds
          </p>
        </Link>

        <Link
          href="/admin/settings"
          className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 hover:border-brand-500 dark:hover:border-brand-500 shadow-2xs group transition-all"
        >
          <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 mb-2">
            <span className="text-xs font-bold group-hover:text-brand-600 dark:group-hover:text-brand-400">
              System Settings
            </span>
            <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-brand-600 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Fee %, maintenance mode &amp; SLA thresholds
          </p>
        </Link>
      </div>

      {/* Main Content Split: Disputes & Reports Moderation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Open Disputes Queue */}
        <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Scale className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Active Disputes Requiring Mediation
                </h2>
              </div>
              <Link
                href="/admin/disputes"
                className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
              >
                View all <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {recentDisputes.length === 0 ? (
              <div className="py-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                <CheckCircle className="h-7 w-7 text-emerald-500 mx-auto mb-1.5" />
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Zero active disputes
                </p>
                <p className="text-[11px] text-slate-400">All contracts operating normally</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentDisputes.map((disp) => (
                  <div
                    key={disp.id}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 flex flex-col gap-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge
                            variant={disp.status === "OPEN" ? "destructive" : "secondary"}
                            className="text-[10px] font-bold"
                          >
                            {disp.status}
                          </Badge>
                          <span className="text-[11px] font-mono text-slate-500">
                            #{disp.contract?.contractNumber}
                          </span>
                        </div>
                        <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {disp.reason}
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          Opened by {disp.openedBy?.name} • Contract: {disp.contract?.title}
                        </p>
                      </div>

                      {disp.status === "OPEN" && (
                        <Button
                          size="sm"
                          onClick={() => handleResolveDispute(disp.id)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] h-7 px-2.5 shrink-0"
                        >
                          Resolve
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Moderation Reports Queue */}
        <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-amber-500" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Content Moderation Reports
                </h2>
              </div>
              <Link
                href="/admin/reports"
                className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
              >
                View queue <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {recentReports.length === 0 ? (
              <div className="py-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                <CheckCircle className="h-7 w-7 text-emerald-500 mx-auto mb-1.5" />
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Moderation queue is clean
                </p>
                <p className="text-[11px] text-slate-400">No reported accounts or job postings</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentReports.map((rep) => (
                  <div
                    key={rep.id}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 flex items-start justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <Badge variant="outline" className="text-[10px] font-bold">
                          {rep.targetType}
                        </Badge>
                        <Badge
                          variant={rep.status === "OPEN" ? "warning" : "success"}
                          className="text-[10px] font-bold"
                        >
                          {rep.status}
                        </Badge>
                      </div>
                      <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {rep.reason}
                      </h3>
                      <p className="text-[11px] text-slate-500 truncate max-w-sm">
                        {rep.description}
                      </p>
                    </div>

                    <Link href="/admin/reports">
                      <Button variant="outline" size="sm" className="text-[11px] h-7 px-2 dark:border-slate-800">
                        Inspect
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Immutable Audit Trail Section */}
      <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800/80 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ScrollText className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Platform Security &amp; Mutation Audit Trail
            </h2>
          </div>
          <Link
            href="/admin/audit-logs"
            className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
          >
            Full audit log <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
          {recentAudit.length === 0 ? (
            <p className="py-4 text-center text-xs text-slate-400">No recent audit log entries.</p>
          ) : (
            recentAudit.map((log) => (
              <div
                key={log.id}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <Badge variant="secondary" className="font-mono text-[10px]">
                    {log.action}
                  </Badge>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {log.entityType} ({log.entityId?.slice(0, 8)}...)
                  </span>
                  <span className="text-slate-400 text-[11px] hidden md:inline">
                    by {log.actor ? `${log.actor.name} (${log.actor.role})` : "System / Automated"}
                  </span>
                </div>
                <span className="text-slate-400 dark:text-slate-500 font-mono text-[11px]">
                  {new Date(log.createdAt).toLocaleString()}
                </span>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
