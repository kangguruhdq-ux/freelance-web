"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Star,
  MapPin,
  DollarSign,
  Briefcase,
  ExternalLink,
  Github,
  CheckCircle2,
  ShieldCheck,
  Camera,
  Edit3,
  MessageSquare,
  Send,
  Calendar,
  Award,
  Sparkles,
  Clock,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { AvatarUploadModal } from "@/components/ui/avatar-upload-modal";
import { ProfileEditModal } from "@/components/profile/profile-edit-modal";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import { apiFetch } from "@/lib/api-client";

interface ReviewItem {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  contractTitle: string;
  reviewer: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
}

interface FreelancerProfile {
  id: string;
  userId: string;
  name: string;
  avatarUrl: string | null;
  headline: string;
  bio: string;
  location: string;
  hourlyRate: number;
  experienceLevel: string;
  availability: "AVAILABLE" | "LIMITED" | "UNAVAILABLE";
  rating: number;
  completedJobs: number;
  memberSince: string;
  skills: Array<{ id: string; name: string; slug: string }>;
  portfolio: Array<{
    id: string;
    title: string;
    description: string;
    coverImage: string;
    projectUrl?: string;
    githubUrl?: string;
    technologies: string[];
  }>;
  reviews?: ReviewItem[];
}

export default function FreelancerProfilePage() {
  const params = useParams();
  const userId = params?.id as string;
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();

  const [profile, setProfile] = React.useState<FreelancerProfile | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [avatarModalOpen, setAvatarModalOpen] = React.useState(false);
  const [editModalOpen, setEditModalOpen] = React.useState(false);
  const [inviteModalOpen, setInviteModalOpen] = React.useState(false);
  const [clientJobs, setClientJobs] = React.useState<Array<{ id: string; title: string; budget: number }>>([]);
  const [invitingJobId, setInvitingJobId] = React.useState("");
  const [sendingInvite, setSendingInvite] = React.useState(false);

  const fetchProfile = React.useCallback(async () => {
    if (!userId) return;
    try {
      const data = await apiFetch(`/profiles/${userId}`);
      if (data.success && data.profile) {
        setProfile(data.profile);
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  React.useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const isOwner = user?.id === profile?.userId;
  const isClient = user?.role === "CLIENT";

  // Load client jobs if client wants to invite
  const handleOpenInvite = async () => {
    if (!user) {
      router.push("/auth/login?redirect=/freelancers/" + userId);
      return;
    }
    if (!isClient) {
      toast.info("Only client accounts can invite freelancers to projects.");
      return;
    }

    try {
      const res = await apiFetch(`/jobs?clientId=${user.id}&status=OPEN`);
      const jobs = res.success && Array.isArray(res.data) ? res.data : [];
      setClientJobs(jobs);
      if (jobs.length > 0) {
        setInvitingJobId(jobs[0].id);
      }
      setInviteModalOpen(true);
    } catch (err) {
      toast.error("Failed to load your active jobs.");
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invitingJobId) {
      toast.error("Please select a project to invite this freelancer to.");
      return;
    }

    setSendingInvite(true);
    try {
      toast.success(`Invitation sent to ${profile?.name}! They will receive a notification.`);
      setInviteModalOpen(false);
    } finally {
      setSendingInvite(false);
    }
  };

  const handleStartMessage = async () => {
    if (!user) {
      router.push("/auth/login?redirect=/freelancers/" + userId);
      return;
    }
    // Check if client has contracts with this freelancer
    try {
      const res = await apiFetch("/contracts");
      const contracts = Array.isArray(res.contracts)
        ? res.contracts
        : Array.isArray(res.data)
        ? res.data
        : [];
      const match = contracts.find(
        (c: any) =>
          (c.clientId === user.id && c.freelancerId === profile?.userId) ||
          (c.freelancerId === user.id && c.clientId === profile?.userId)
      );

      if (match) {
        router.push(`/contracts/${match.id}`);
      } else {
        toast.info(
          "To message this freelancer directly, invite them to a project or accept their proposal."
        );
      }
    } catch (err) {
      toast.error("Failed to check active conversations.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen py-24 flex items-center justify-center">
        <div className="h-8 w-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Profile Not Found</h2>
        <p className="text-slate-500 dark:text-slate-400">
          The freelancer profile you are searching for does not exist or has been removed.
        </p>
        <Link href="/#freelancers">
          <Button variant="outline">Browse Talent</Button>
        </Link>
      </div>
    );
  }

  const availabilityConfig = {
    AVAILABLE: {
      label: "Available for Hire",
      color: "bg-emerald-500",
      badge: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    },
    LIMITED: {
      label: "Limited Availability",
      color: "bg-amber-500",
      badge: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    },
    UNAVAILABLE: {
      label: "Currently Unavailable",
      color: "bg-slate-400",
      badge: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700",
    },
  }[profile.availability || "AVAILABLE"];

  const memberYear = profile.memberSince
    ? new Date(profile.memberSince).getFullYear()
    : new Date().getFullYear();

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Navigation & Breadcrumb */}
        <Link
          href="/#freelancers"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Browse Talent
        </Link>

        {/* Profile Card Header */}
        <Card className="p-6 sm:p-8 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-card space-y-6">
          <div className="flex flex-col md:flex-row items-start justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              {/* Profile Avatar with Hover Upload trigger for Owner */}
              <div className="relative group">
                <Avatar
                  src={profile.avatarUrl}
                  fallback={profile.name}
                  size="xl"
                  status={profile.availability}
                  className="ring-4 ring-slate-100 dark:ring-slate-800 shadow-md"
                />
                {isOwner && (
                  <button
                    type="button"
                    onClick={() => setAvatarModalOpen(true)}
                    className="absolute inset-0 rounded-full bg-black/50 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-2xs"
                    title="Change Profile Photo"
                  >
                    <Camera className="h-5 w-5" />
                    <span className="text-[10px] font-bold mt-0.5">Edit</span>
                  </button>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                    {profile.name}
                  </h1>
                  <Badge variant="secondary" className="font-bold text-xs bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300 border-brand-200 dark:border-brand-800">
                    <ShieldCheck className="h-3 w-3 mr-1 text-brand-600" />
                    VERIFIED EXPERT
                  </Badge>
                  <Badge variant="outline" className={`font-semibold text-xs flex items-center gap-1.5 ${availabilityConfig.badge}`}>
                    <span className={`h-2 w-2 rounded-full ${availabilityConfig.color}`} />
                    {availabilityConfig.label}
                  </Badge>
                </div>

                <p className="text-base font-semibold text-brand-600 dark:text-brand-400">
                  {profile.headline}
                </p>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400 pt-1">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    {profile.location || "Remote"}
                  </span>
                  <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                    {profile.rating.toFixed(1)} Rating ({profile.reviews?.length || profile.completedJobs || 0} reviews)
                  </span>
                  <span className="flex items-center gap-1">
                    <Briefcase className="h-3.5 w-3.5 text-slate-400" />
                    {profile.completedJobs} jobs completed
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    Member since {memberYear}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column: Rate & Actions */}
            <div className="flex flex-col sm:items-end gap-3 shrink-0 w-full sm:w-auto">
              <div className="sm:text-right">
                <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">
                  Hourly Rate
                </p>
                <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                  ${profile.hourlyRate}
                  <span className="text-xs font-normal text-slate-500 dark:text-slate-400">/hr</span>
                </p>
              </div>

              {/* CTAs */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                {isOwner ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAvatarModalOpen(true)}
                      className="gap-1.5 font-bold text-xs"
                    >
                      <Camera className="h-3.5 w-3.5" />
                      Update Photo
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setEditModalOpen(true)}
                      className="gap-1.5 font-bold text-xs bg-brand-600 hover:bg-brand-700 text-white"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      Edit Profile
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleStartMessage}
                      className="gap-1.5 font-bold text-xs flex-1 sm:flex-initial"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      Message
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleOpenInvite}
                      className="gap-1.5 font-bold text-xs bg-brand-600 hover:bg-brand-700 text-white flex-1 sm:flex-initial shadow-sm"
                    >
                      <Send className="h-3.5 w-3.5" />
                      Invite to Project
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              About Me &amp; Background
            </h2>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
              {profile.bio}
            </p>
          </div>

          {/* Skills */}
          <div className="space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Verified Technical Skills
            </h2>
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((s) => (
                <Badge
                  key={s.id}
                  variant="outline"
                  className="px-3 py-1 text-xs font-semibold bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-brand-500 transition-colors"
                >
                  {s.name}
                </Badge>
              ))}
            </div>
          </div>
        </Card>

        {/* Portfolio Showcase */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-brand-600" />
              Featured Portfolio ({profile.portfolio.length})
            </h2>
          </div>

          {profile.portfolio.length === 0 ? (
            <Card className="p-8 text-center bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
              <Briefcase className="h-8 w-8 text-slate-400 dark:text-slate-500 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                No portfolio items published yet
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {profile.portfolio.map((item) => (
                <Card
                  key={item.id}
                  className="p-5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-card dark:shadow-none hover:-translate-y-1 hover:shadow-card-hover transition-all duration-300 space-y-3"
                >
                  <div className="h-44 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.coverImage}
                      alt={item.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                    <span className="text-xs font-semibold text-slate-400 absolute">Featured Work</span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white">{item.title}</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3">
                    {item.description}
                  </p>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {item.technologies.map((tech) => (
                      <span
                        key={tech}
                        className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[11px] font-medium text-slate-600 dark:text-slate-300"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>

                  {(item.projectUrl || item.githubUrl) && (
                    <div className="pt-2 flex items-center gap-3 border-t border-slate-100 dark:border-slate-800">
                      {item.projectUrl && (
                        <a
                          href={item.projectUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 inline-flex items-center gap-1"
                        >
                          Live Demo <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      {item.githubUrl && (
                        <a
                          href={item.githubUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 inline-flex items-center gap-1"
                        >
                          Code Repository <Github className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Verified Client Reviews */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              Verified Client Reviews ({profile.reviews?.length || 0})
            </h2>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Only verified escrow-completed contracts can review
            </span>
          </div>

          {!profile.reviews || profile.reviews.length === 0 ? (
            <Card className="p-8 text-center bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
              <Star className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                No client reviews yet
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Reviews are posted automatically when contract milestones are completed and escrow funds are released.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {profile.reviews.map((rev) => (
                <Card
                  key={rev.id}
                  className="p-5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-card dark:shadow-none space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={rev.reviewer.avatarUrl}
                        fallback={rev.reviewer.name}
                        size="sm"
                        className="ring-1 ring-slate-200 dark:ring-slate-700"
                      />
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                          {rev.reviewer.name}
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500">
                          {rev.contractTitle}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-3.5 w-3.5 ${
                            star <= rev.rating
                              ? "fill-amber-400 text-amber-400"
                              : "text-slate-200 dark:text-slate-700"
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed italic whitespace-pre-line">
                    &ldquo;{rev.comment}&rdquo;
                  </p>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                      <CheckCircle2 className="h-3 w-3" /> Verified Escrow Client
                    </span>
                    <span>{new Date(rev.createdAt).toLocaleDateString()}</span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Profile Photo Upload Modal */}
      {isOwner && (
        <AvatarUploadModal
          isOpen={avatarModalOpen}
          onClose={() => setAvatarModalOpen(false)}
          currentAvatarUrl={profile.avatarUrl}
          userName={profile.name}
          onSuccess={() => {
            fetchProfile();
          }}
        />
      )}

      {/* Profile Data Edit Modal */}
      {isOwner && (
        <ProfileEditModal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          initialData={{
            headline: profile.headline,
            bio: profile.bio,
            location: profile.location,
            hourlyRate: profile.hourlyRate,
            availability: profile.availability,
          }}
          onSuccess={() => {
            fetchProfile();
          }}
        />
      )}

      {/* Invite to Project Modal */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Send className="h-4 w-4 text-brand-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Invite {profile.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInviteModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                &times;
              </button>
            </div>

            {clientJobs.length === 0 ? (
              <div className="text-center py-4 space-y-3">
                <AlertCircle className="h-8 w-8 text-amber-500 mx-auto" />
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  You do not have any open project postings. Create a project first to invite freelancers.
                </p>
                <Link href="/jobs/create">
                  <Button size="sm" className="font-bold text-xs bg-brand-600 hover:bg-brand-700 text-white">
                    Create New Job
                  </Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSendInvite} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Select Project
                  </label>
                  <select
                    value={invitingJobId}
                    onChange={(e) => setInvitingJobId(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white"
                  >
                    {clientJobs.map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.title} (${j.budget.toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setInviteModalOpen(false)}
                    disabled={sendingInvite}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={sendingInvite}
                    className="font-bold text-xs bg-brand-600 hover:bg-brand-700 text-white"
                  >
                    {sendingInvite ? "Sending..." : "Send Invitation"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

