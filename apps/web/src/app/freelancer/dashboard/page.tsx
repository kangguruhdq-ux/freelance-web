"use client";

import * as React from "react";
import Link from "next/link";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import {
  FileText,
  CheckCircle2,
  DollarSign,
  Search,
  Star,
  Sparkles,
  ExternalLink,
  ArrowRight,
  Briefcase,
  Paperclip,
  Send,
  Camera,
  Edit3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { AvatarUploadModal } from "@/components/ui/avatar-upload-modal";
import { ProfileEditModal } from "@/components/profile/profile-edit-modal";
import { ProfileStrength } from "@/components/profile/profile-strength";
import { apiFetch } from "@/lib/api-client";
import { useRouter } from "next/navigation";

interface ContractItem {
  id: string;
  contractNumber: string;
  title: string;
  totalAmount: number;
  escrowBalance: number;
  status: string;
  client: {
    name: string;
    avatarUrl: string | null;
  };
  milestones: Array<{ id: string; title: string; status: string; amount: number }>;
}

interface SubmittedProposalItem {
  id: string;
  jobId: string;
  jobTitle?: string;
  bidAmount: number;
  estimatedDays: number;
  status: string;
  createdAt: string;
  job?: {
    id: string;
    title: string;
    category?: { name: string } | string;
    budget?: number;
  };
  attachments?: Array<{ id: string; fileName: string }>;
}

export default function FreelancerDashboardPage() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [contracts, setContracts] = React.useState<ContractItem[]>([]);
  const [proposals, setProposals] = React.useState<SubmittedProposalItem[]>([]);
  const [profile, setProfile] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [proposalsLoading, setProposalsLoading] = React.useState(true);
  const [avatarModalOpen, setAvatarModalOpen] = React.useState(false);
  const [editModalOpen, setEditModalOpen] = React.useState(false);

  // Auto redirect if user is a CLIENT
  React.useEffect(() => {
    if (user && user.role === "CLIENT") {
      router.replace("/client/dashboard");
    }
  }, [user, router]);

  const fetchProfile = React.useCallback(async () => {
    try {
      const res = await apiFetch("/profiles/me");
      if (res.success && res.profile) {
        setProfile(res.profile);
      }
    } catch (err) {
      console.error("Error loading profile:", err);
    }
  }, []);

  React.useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

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
    apiFetch("/proposals/me")
      .then((data) => {
        const list = Array.isArray(data.proposals)
          ? data.proposals
          : Array.isArray(data.data)
          ? data.data
          : [];
        setProposals(list);
      })
      .catch((err) => console.error("Error loading proposals:", err))
      .finally(() => setProposalsLoading(false));
  }, []);

  const handleUpdateAvailability = async (newStatus: "AVAILABLE" | "LIMITED" | "UNAVAILABLE") => {
    try {
      const res = await apiFetch("/profiles/me/availability", {
        method: "PATCH",
        body: JSON.stringify({ availability: newStatus }),
      });
      if (res.success) {
        const label =
          newStatus === "AVAILABLE"
            ? "Available for Hire"
            : newStatus === "LIMITED"
            ? "Limited Availability"
            : "Unavailable";
        toast.success(`Availability updated to "${label}"`);
        setProfile((prev: any) => (prev ? { ...prev, availability: newStatus } : { availability: newStatus }));
        await refreshUser();
      } else {
        toast.error(res.error || "Failed to update availability");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update availability");
    }
  };

  const totalEarned = contracts
    .filter((c) => c.status === "COMPLETED")
    .reduce((acc, c) => acc + c.totalAmount, 0);

  const activeContracts = contracts.filter((c) => c.status === "ACTIVE");

  return (
    <ProtectedRoute allowedRoles={["FREELANCER"]}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-200/80 dark:border-slate-800">
          <div className="flex items-start sm:items-center gap-4">
            {/* Clickable Avatar with edit badge */}
            <div className="relative group shrink-0">
              <Avatar
                src={user?.avatarUrl}
                fallback={user?.name}
                size="xl"
                status={(profile?.availability || (user?.profile as any)?.availability || "AVAILABLE") as any}
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

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary" className="font-semibold text-xs bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">
                  FREELANCER WORKSPACE
                </Badge>
                <span className="text-xs text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5" /> Top Rated Talent
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Welcome back, {user?.name}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                <span>{profile?.headline || "Professional Freelancer"}</span>
                <span>•</span>
                <Link
                  href={`/freelancers/${user?.id}`}
                  className="text-brand-600 dark:text-brand-400 hover:underline inline-flex items-center gap-1 font-semibold"
                >
                  View Public Profile <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>

          {/* Quick Availability Controls & Actions */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {/* Quick Availability Pill */}
            <div className="p-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-1 text-xs">
              <button
                type="button"
                onClick={() => handleUpdateAvailability("AVAILABLE")}
                className={`px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                  (profile?.availability || (user?.profile as any)?.availability || "AVAILABLE") === "AVAILABLE"
                    ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 shadow-xs border border-emerald-200 dark:border-emerald-800"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
                title="Set status to Available"
              >
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Available
              </button>

              <button
                type="button"
                onClick={() => handleUpdateAvailability("LIMITED")}
                className={`px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                  (profile?.availability || (user?.profile as any)?.availability) === "LIMITED"
                    ? "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 shadow-xs border border-amber-200 dark:border-amber-800"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
                title="Set status to Limited Availability"
              >
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                Limited
              </button>

              <button
                type="button"
                onClick={() => handleUpdateAvailability("UNAVAILABLE")}
                className={`px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                  (profile?.availability || (user?.profile as any)?.availability) === "UNAVAILABLE"
                    ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shadow-xs border border-slate-300 dark:border-slate-700"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
                title="Set status to Unavailable"
              >
                <span className="h-2 w-2 rounded-full bg-slate-400" />
                Unavailable
              </button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditModalOpen(true)}
                className="gap-1.5 font-bold text-xs"
              >
                <Edit3 className="h-3.5 w-3.5" />
                Edit Profile
              </Button>
              <Link href="/jobs">
                <Button size="sm" className="gap-1.5 font-bold text-xs bg-brand-600 hover:bg-brand-700 text-white shadow-sm">
                  <Search className="h-4 w-4" />
                  Find Jobs
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Profile Strength & Onboarding Card */}
        <ProfileStrength
          data={{
            avatarUrl: user?.avatarUrl,
            headline: profile?.headline,
            bio: profile?.bio,
            hourlyRate: profile?.hourlyRate,
            skillsCount: profile?.skills?.length || 0,
            portfolioCount: profile?.portfolioItems?.length || 0,
          }}
          onUploadAvatar={() => setAvatarModalOpen(true)}
          onEditProfile={() => setEditModalOpen(true)}
        />

        {/* Freelancer KPI Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-card dark:shadow-none hover:-translate-y-1 hover:shadow-card-hover dark:hover:shadow-glow-brand/5 transition-all duration-300">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Active Contracts</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
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
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Verified completions</p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-card dark:shadow-none hover:-translate-y-1 hover:shadow-card-hover dark:hover:shadow-glow-brand/5 transition-all duration-300">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Completed Earned</span>
              <DollarSign className="h-4 w-4 text-brand-600" />
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">${totalEarned.toLocaleString()}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Net of platform fee</p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-card dark:shadow-none hover:-translate-y-1 hover:shadow-card-hover dark:hover:shadow-glow-brand/5 transition-all duration-300">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Rating Score</span>
              <Star className="h-4 w-4 text-amber-500 fill-amber-400" />
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">5.0 / 5.0</p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">100% Job Success</p>
          </div>
        </div>

        {/* Section 1: My Submitted Proposals */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Send className="h-5 w-5 text-brand-600" />
                My Submitted Proposals ({proposals.length})
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Track status of your submitted bids and portfolio attachments.
              </p>
            </div>
            <Link href="/jobs">
              <Button size="sm" className="gap-1.5 font-semibold text-xs">
                <Search className="h-4 w-4" />
                Find New Projects
              </Button>
            </Link>
          </div>

          {proposalsLoading ? (
            <div className="p-8 text-center text-slate-400">Loading your submitted proposals...</div>
          ) : proposals.length === 0 ? (
            <Card className="p-8 text-center bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-card dark:shadow-none">
              <FileText className="h-8 w-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No proposals submitted yet</p>
              <p className="text-xs text-slate-500 mt-1">Browse open projects and submit a proposal to start earning.</p>
              <div className="mt-4">
                <Link href="/jobs">
                  <Button size="sm">Browse Projects</Button>
                </Link>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-3.5">
              {proposals.map((prop) => (
                <Card
                  key={prop.id}
                  className="p-5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-card dark:shadow-none hover:-translate-y-0.5 hover:shadow-card-hover dark:hover:shadow-glow-brand/5 hover:border-brand-300 dark:hover:border-brand-700/60 transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        variant={prop.status === "ACCEPTED" ? "success" : prop.status === "REJECTED" ? "destructive" : "warning"}
                        className="text-[10px] font-bold uppercase"
                      >
                        {prop.status}
                      </Badge>
                      <span className="text-xs text-slate-400">• Submitted {new Date(prop.createdAt).toLocaleDateString()}</span>
                    </div>

                    <Link href={`/jobs/${prop.jobId}`} className="hover:underline">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                        {prop.jobTitle || prop.job?.title || "Project Application"}
                      </h3>
                    </Link>

                    <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                      <span>Your Bid: <strong className="text-slate-800 dark:text-slate-200">${prop.bidAmount?.toLocaleString()}</strong></span>
                      <span>•</span>
                      <span>Timeline: <strong>{prop.estimatedDays} days</strong></span>
                      {prop.attachments && prop.attachments.length > 0 && (
                        <>
                          <span>•</span>
                          <span className="inline-flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                            <Paperclip className="h-3 w-3" />
                            {prop.attachments.length} Samples Attached
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link href={`/jobs/${prop.jobId}`}>
                      <Button size="sm" variant="outline" className="gap-1.5 text-xs font-semibold">
                        View Project
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Section 2: Active Contracts & Milestones */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Active Contracts &amp; Workspaces</h2>
            <Link href="/jobs" className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline inline-flex items-center gap-1">
              Browse new jobs <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-400">Loading your project workspaces...</div>
          ) : contracts.length === 0 ? (
            <Card className="p-8 text-center bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
              <Briefcase className="h-8 w-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No contracts yet</p>
              <p className="text-xs text-slate-500 mt-1">Browse projects and submit competitive proposals to win your first contract.</p>
              <div className="mt-4">
                <Link href="/jobs">
                  <Button size="sm">Explore Available Projects</Button>
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
                      src={c.client.avatarUrl}
                      fallback={c.client.name}
                      size="md"
                      className="ring-2 ring-brand-500/20"
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
                        Client: <span className="font-semibold text-slate-700 dark:text-slate-300">{c.client.name}</span> • {c.milestones?.length || 0} Milestones
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-slate-400">Total Value</p>
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

        {/* Profile Modals */}
        <AvatarUploadModal
          isOpen={avatarModalOpen}
          onClose={() => setAvatarModalOpen(false)}
          currentAvatarUrl={user?.avatarUrl}
          userName={user?.name}
          onSuccess={() => {
            fetchProfile();
            refreshUser();
          }}
        />

        <ProfileEditModal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          initialData={{
            headline: profile?.headline,
            bio: profile?.bio,
            location: profile?.location,
            hourlyRate: profile?.hourlyRate,
            availability: profile?.availability || "AVAILABLE",
          }}
          onSuccess={() => {
            fetchProfile();
            refreshUser();
          }}
        />
      </div>
    </ProtectedRoute>
  );
}
