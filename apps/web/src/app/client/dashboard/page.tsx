"use client";

import * as React from "react";
import Link from "next/link";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useAuth } from "@/context/auth-context";
import { Briefcase, FileText, CheckCircle2, DollarSign, Plus, Search, ShieldCheck, ArrowRight, ExternalLink, Users, Sparkles, FolderPlus, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { AvatarUploadModal } from "@/components/ui/avatar-upload-modal";
import { apiFetch } from "@/lib/api-client";
import { useRouter } from "next/navigation";

interface ContractItem {
  id: string;
  contractNumber: string;
  title: string;
  totalAmount: number;
  escrowBalance: number;
  status: string;
  freelancer: {
    name: string;
    avatarUrl: string | null;
  };
  milestones: Array<{ id: string; title: string; status: string; amount: number }>;
}

interface PostedJobItem {
  id: string;
  title: string;
  category: { name: string } | string;
  budget: number;
  budgetType: string;
  status: string;
  proposalsCount: number;
  createdAt: string;
}

export default function ClientDashboardPage() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const [contracts, setContracts] = React.useState<ContractItem[]>([]);
  const [myJobs, setMyJobs] = React.useState<PostedJobItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [jobsLoading, setJobsLoading] = React.useState(true);
  const [avatarModalOpen, setAvatarModalOpen] = React.useState(false);

  // Auto redirect if user is a FREELANCER
  React.useEffect(() => {
    if (user && user.role === "FREELANCER") {
      router.replace("/freelancer/dashboard");
    }
  }, [user, router]);

  React.useEffect(() => {
    apiFetch("/contracts")
      .then((data) => {
        const list = Array.isArray(data.contracts)
          ? data.contracts
          : Array.isArray(data.data)
          ? data.data
          : [];
        setContracts(list);
      })
      .catch((err) => console.error("Error loading contracts:", err))
      .finally(() => setLoading(false));
  }, []);

  React.useEffect(() => {
    if (!user?.id) return;
    apiFetch(`/jobs?clientId=${user.id}&status=ALL&limit=50`)
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setMyJobs(data.data);
        } else if (data.success && Array.isArray(data.jobs)) {
          setMyJobs(data.jobs);
        }
      })
      .catch((err) => console.error("Error loading my jobs:", err))
      .finally(() => setJobsLoading(false));
  }, [user?.id]);

  const totalSpent = contracts.reduce((acc, c) => acc + c.totalAmount, 0);
  const activeContracts = contracts.filter((c) => c.status === "ACTIVE");

  return (
    <ProtectedRoute allowedRoles={["CLIENT"]}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/80 dark:border-slate-800">
          <div className="flex items-start sm:items-center gap-4">
            <div className="relative group shrink-0">
              <Avatar
                src={user?.avatarUrl}
                fallback={user?.name}
                size="xl"
                className="ring-4 ring-slate-100 dark:ring-slate-800 shadow-sm"
              />
              <button
                type="button"
                onClick={() => setAvatarModalOpen(true)}
                className="absolute inset-0 rounded-full bg-black/50 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-2xs"
                title="Change Avatar"
              >
                <Camera className="h-4 w-4" />
                <span className="text-[9px] font-bold">Edit</span>
              </button>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="default" className="font-semibold text-xs">
                  CLIENT PORTAL
                </Badge>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5" /> Escrow Verified
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Welcome back, {user?.name}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                {user?.email} • Manage your active job postings, contract milestones, and talent proposals
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/jobs">
              <Button variant="outline" size="sm" className="gap-1.5 font-semibold">
                <Search className="h-4 w-4" />
                Browse Talent
              </Button>
            </Link>
            <Link href="/client/jobs/new">
              <Button size="sm" className="gap-1.5 font-semibold">
                <Plus className="h-4 w-4" />
                Post a Project
              </Button>
            </Link>
          </div>
        </div>

        {/* Client KPI Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-card dark:shadow-none hover:-translate-y-1 hover:shadow-card-hover dark:hover:shadow-glow-brand/5 transition-all duration-300">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Active Contracts</span>
              <Briefcase className="h-4 w-4 text-brand-600" />
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">{activeContracts.length}</p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">Live in workspace</p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-card dark:shadow-none hover:-translate-y-1 hover:shadow-card-hover dark:hover:shadow-glow-brand/5 transition-all duration-300">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Contracts</span>
              <FileText className="h-4 w-4 text-indigo-600" />
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">{contracts.length}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">With vetted specialists</p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-card dark:shadow-none hover:-translate-y-1 hover:shadow-card-hover dark:hover:shadow-glow-brand/5 transition-all duration-300">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Milestones Completed</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {contracts.reduce((acc, c) => acc + (c.milestones?.filter((m) => m.status === "APPROVED").length || 0), 0)}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Approved &amp; released</p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-card dark:shadow-none hover:-translate-y-1 hover:shadow-card-hover dark:hover:shadow-glow-brand/5 transition-all duration-300">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Invested</span>
              <DollarSign className="h-4 w-4 text-amber-600" />
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">${totalSpent.toLocaleString()}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">100% escrow backed</p>
          </div>
        </div>

        {/* Section 1: My Posted Projects */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-brand-600" />
                My Posted Projects ({myJobs.length})
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Track incoming proposals, review applicants, and hire talent.
              </p>
            </div>
            <Link href="/client/jobs/new">
              <Button size="sm" className="gap-1.5 font-semibold text-xs">
                <Plus className="h-4 w-4" />
                Post a Project
              </Button>
            </Link>
          </div>

          {jobsLoading ? (
            <div className="p-8 text-center text-slate-400">Loading your posted projects...</div>
          ) : myJobs.length === 0 ? (
            <Card className="p-8 text-center bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-card dark:shadow-none">
              <FolderPlus className="h-8 w-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No projects posted yet</p>
              <p className="text-xs text-slate-500 mt-1">Post a job description with your budget to start receiving proposals from top specialists.</p>
              <div className="mt-4">
                <Link href="/client/jobs/new">
                  <Button size="sm">Post Your First Project</Button>
                </Link>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-3.5">
              {myJobs.map((job) => (
                <Card
                  key={job.id}
                  className="p-5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-card dark:shadow-none hover:-translate-y-0.5 hover:shadow-card-hover dark:hover:shadow-glow-brand/5 hover:border-brand-300 dark:hover:border-brand-700/60 transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        variant={job.status === "OPEN" ? "success" : job.status === "IN_PROGRESS" ? "accent" : "outline"}
                        className="text-[10px] font-bold"
                      >
                        {job.status}
                      </Badge>
                      <span className="text-xs font-semibold text-brand-600 dark:text-brand-400">
                        {typeof job.category === "object" ? job.category.name : job.category}
                      </span>
                      <span className="text-xs text-slate-400">• Posted {new Date(job.createdAt).toLocaleDateString()}</span>
                    </div>

                    <Link href={`/jobs/${job.id}`} className="hover:underline">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                        {job.title}
                      </h3>
                    </Link>

                    <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                      <span>Budget: <strong className="text-slate-800 dark:text-slate-200">${job.budget?.toLocaleString()} ({job.budgetType})</strong></span>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1 font-semibold text-brand-600 dark:text-brand-400">
                        <Users className="h-3.5 w-3.5" />
                        {job.proposalsCount || 0} Proposals Received
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link href={`/jobs/${job.id}`}>
                      <Button size="sm" className="gap-1.5 font-bold text-xs bg-brand-600 hover:bg-brand-700 text-white shadow-sm">
                        <Users className="h-3.5 w-3.5" />
                        Review Proposals ({job.proposalsCount || 0})
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Section 2: Active Contracts List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Active Project Workspaces</h2>
            <Link href="/jobs" className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline inline-flex items-center gap-1">
              Find more talent <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-400">Loading your project workspaces...</div>
          ) : contracts.length === 0 ? (
            <Card className="p-8 text-center bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
              <Briefcase className="h-8 w-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No active contracts yet</p>
              <p className="text-xs text-slate-500 mt-1">Post a project or browse talent to hire top freelancers.</p>
              <div className="mt-4">
                <Link href="/client/jobs/new">
                  <Button size="sm">Post a Project</Button>
                </Link>
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              {contracts.map((c) => (
                <Card
                  key={c.id}
                  className="p-5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-card dark:shadow-none hover:-translate-y-0.5 hover:shadow-card-hover dark:hover:shadow-glow-brand/5 hover:border-brand-300 dark:hover:border-brand-700/60 transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3.5">
                    <Avatar
                      src={c.freelancer.avatarUrl}
                      fallback={c.freelancer.name}
                      size="md"
                      className="ring-2 ring-emerald-500/20"
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-semibold text-slate-400">{c.contractNumber}</span>
                        <Badge variant={c.status === "ACTIVE" ? "success" : "outline"} className="text-[10px]">
                          {c.status}
                        </Badge>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">{c.title}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Freelancer: <span className="font-semibold text-slate-700 dark:text-slate-300">{c.freelancer.name}</span> • {c.milestones?.length || 0} Milestones
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-slate-400">Escrow Protected</p>
                      <p className="text-base font-bold text-slate-900 dark:text-white">${c.totalAmount.toLocaleString()}</p>
                    </div>
                    <Link href={`/contracts/${c.id}`}>
                      <Button size="sm" className="gap-1.5 font-semibold text-xs">
                        Open Workspace
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        <AvatarUploadModal
          isOpen={avatarModalOpen}
          onClose={() => setAvatarModalOpen(false)}
          currentAvatarUrl={user?.avatarUrl}
          userName={user?.name}
          onSuccess={() => {
            refreshUser();
          }}
        />
      </div>
    </ProtectedRoute>
  );
}
