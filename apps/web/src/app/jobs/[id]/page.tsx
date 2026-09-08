"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import {
  ArrowLeft,
  Briefcase,
  DollarSign,
  Calendar,
  ShieldCheck,
  Send,
  User,
  CheckCircle,
  FileText,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api-client";

interface JobDetail {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  category: string;
  budget: number;
  budgetType: string;
  experienceLevel: string;
  locationType: string;
  duration?: string;
  status: string;
  proposalsCount: number;
  createdAt: string;
  client: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
  };
  skills: Array<{ id: string; name: string }>;
}

interface ProposalItem {
  id: string;
  coverLetter: string;
  bidAmount: number;
  estimatedDays: number;
  status: string;
  createdAt: string;
  freelancer: {
    id: string;
    name: string;
    avatarUrl: string | null;
    headline: string;
    rating: number;
    completedJobs: number;
  };
}

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const jobId = params?.id as string;

  const [job, setJob] = React.useState<JobDetail | null>(null);
  const [proposals, setProposals] = React.useState<ProposalItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Proposal submission form state
  const [bidAmount, setBidAmount] = React.useState<string>("");
  const [estimatedDays, setEstimatedDays] = React.useState<string>("7");
  const [coverLetter, setCoverLetter] = React.useState<string>("");
  const [submitting, setSubmitting] = React.useState(false);
  const [proposalSuccess, setProposalSuccess] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState("");

  React.useEffect(() => {
    if (!jobId) return;

    const fetchJob = async () => {
      try {
        const json = await apiFetch(`/jobs/${jobId}`);
        if (json.success && json.job) {
          setJob(json.job);
          setBidAmount(String(json.job.budget));
        }
      } catch (err) {
        console.error("Failed to load job:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [jobId]);

  // If user is the client owner, load proposals
  React.useEffect(() => {
    if (!job || !user || job.client.id !== user.id) return;

    const fetchProposals = async () => {
      try {
        const json = await apiFetch(`/jobs/${jobId}/proposals`);
        if (json.success && Array.isArray(json.data)) {
          setProposals(json.data);
        }
      } catch (err) {
        console.error("Failed to load job proposals:", err);
      }
    };

    fetchProposals();
  }, [job, user, jobId]);

  const handleSubmitProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSubmitting(true);

    try {
      const json = await apiFetch("/proposals", {
        method: "POST",
        body: JSON.stringify({
          jobId,
          bidAmount: parseFloat(bidAmount),
          estimatedDays: parseInt(estimatedDays, 10),
          coverLetter,
        }),
      });

      if (!json.success) {
        setErrorMsg(json.error || "Failed to submit proposal");
        return;
      }

      setProposalSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message || "Network error submitting proposal");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen py-24 flex items-center justify-center">
        <div className="h-8 w-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">Job Not Found</h2>
        <p className="text-slate-500">The project you are looking for may have been closed or removed.</p>
        <Link href="/jobs">
          <Button variant="outline">Back to Jobs</Button>
        </Link>
      </div>
    );
  }

  const isClientOwner = user?.id === job.client.id;
  const isFreelancer = user?.role === "FREELANCER";

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Back Link */}
        <Link href="/jobs" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to all jobs
        </Link>

        {/* Job Header Card */}
        <Card className="p-6 sm:p-8 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-card space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="default" className="text-xs font-semibold">
                  {job.category}
                </Badge>
                <Badge variant="outline" className="text-xs font-medium">
                  {job.status}
                </Badge>
                <span className="text-xs text-slate-400">
                  Posted {new Date(job.createdAt).toLocaleDateString()}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {job.title}
              </h1>
            </div>

            <div className="sm:text-right shrink-0">
              <p className="text-xs uppercase font-semibold text-slate-400">Budget</p>
              <p className="text-3xl font-black text-slate-900 dark:text-white">
                ${job.budget.toLocaleString()}
              </p>
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1 sm:justify-end mt-0.5">
                <ShieldCheck className="h-3.5 w-3.5" /> Escrow Backed
              </span>
            </div>
          </div>

          {/* Key Meta Details */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
            <div>
              <p className="text-xs text-slate-400 font-medium">Experience Level</p>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">{job.experienceLevel}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Location Type</p>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">{job.locationType}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Proposals</p>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">{job.proposalsCount} received</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Client Verification</p>
              <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">Verified Client</p>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Project Overview</h2>
            <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
              {job.description}
            </div>
          </div>

          {/* Required Skills */}
          {job.skills && job.skills.length > 0 && (
            <div className="space-y-3 pt-2">
              <h3 className="text-xs uppercase font-semibold tracking-wider text-slate-400">Required Skills &amp; Expertise</h3>
              <div className="flex flex-wrap gap-2">
                {job.skills.map((s) => (
                  <span
                    key={s.id}
                    className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium border border-slate-200 dark:border-slate-700"
                  >
                    {s.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Client Owner: Proposals Received Section */}
        {isClientOwner && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">
                Proposals Received ({proposals.length})
              </h2>
            </div>

            {proposals.length === 0 ? (
              <Card className="p-8 text-center bg-white border-slate-200">
                <FileText className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">No proposals submitted yet</p>
                <p className="text-xs text-slate-400 mt-1">
                  Top freelancers will submit bids soon. You will receive notifications when proposals arrive.
                </p>
              </Card>
            ) : (
              proposals.map((p) => (
                <Card key={p.id} className="p-6 bg-white border-slate-200 shadow-card space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-sm uppercase">
                        {p.freelancer.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <Link href={`/freelancers/${p.freelancer.id}`} className="font-bold text-slate-900 hover:text-brand-600 transition-colors">
                            {p.freelancer.name}
                          </Link>
                          <Badge variant="outline" className="text-[10px] font-bold">
                            {p.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500">{p.freelancer.headline || "Independent Specialist"}</p>
                      </div>
                    </div>

                    <div className="sm:text-right">
                      <p className="text-lg font-black text-slate-900">${p.bidAmount.toLocaleString()}</p>
                      <p className="text-xs text-slate-500">Estimated duration: {p.estimatedDays} days</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                    {p.coverLetter}
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Freelancer: Proposal Submission Form */}
        {isFreelancer && (
          <Card className="p-6 sm:p-8 bg-white border-slate-200 shadow-card space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xl font-bold text-slate-900">Submit a Proposal for this Project</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Specify your bid and timeline. Milestone payments will be held securely in escrow before you begin.
              </p>
            </div>

            {proposalSuccess ? (
              <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
                <CheckCircle className="h-8 w-8 text-emerald-600 mx-auto" />
                <h3 className="text-base font-bold text-emerald-900">Proposal Submitted Successfully!</h3>
                <p className="text-xs text-emerald-700">
                  The client has received your bid and cover letter. You can track this proposal in your dashboard.
                </p>
                <Link href="/freelancer/dashboard">
                  <Button variant="outline" size="sm" className="mt-3">
                    View Freelancer Dashboard
                  </Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmitProposal} className="space-y-5">
                {errorMsg && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                    {errorMsg}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Your Total Bid Amount ($)
                    </label>
                    <Input
                      type="number"
                      min="1"
                      required
                      placeholder="e.g. 2500"
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                    />
                    <p className="text-[11px] text-slate-400">Estimated platform fee (10%) deducted upon milestone release.</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Estimated Duration (Days)
                    </label>
                    <Input
                      type="number"
                      min="1"
                      required
                      placeholder="e.g. 14"
                      value={estimatedDays}
                      onChange={(e) => setEstimatedDays(e.target.value)}
                    />
                    <p className="text-[11px] text-slate-400">Calendar days to complete all deliverables.</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Cover Letter &amp; Technical Approach
                  </label>
                  <textarea
                    rows={5}
                    required
                    minLength={20}
                    className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 leading-relaxed resize-y"
                    placeholder="Describe your relevant experience, proposed architecture, and how you will execute this project with milestone precision..."
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                  />
                  <p className="text-[11px] text-slate-400">Minimum 20 characters.</p>
                </div>

                <Button type="submit" disabled={submitting} className="font-semibold gap-2">
                  {submitting ? "Submitting Proposal..." : "Submit Proposal"}
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            )}
          </Card>
        )}

        {/* Not authenticated CTA */}
        {!isAuthenticated && (
          <Card className="p-6 bg-brand-50/50 dark:bg-brand-950/20 border-brand-200 dark:border-brand-900/50 text-center space-y-3">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Want to bid on this project?</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 max-w-md mx-auto">
              Sign up as a freelancer to submit bids, collaborate with verified clients, and get paid securely.
            </p>
            <div className="flex justify-center gap-3 pt-1">
              <Link href={`/login?redirect=${encodeURIComponent(`/jobs/${jobId}`)}`}>
                <Button variant="outline" size="sm">Log In</Button>
              </Link>
              <Link href={`/register?redirect=${encodeURIComponent(`/jobs/${jobId}`)}`}>
                <Button size="sm">Sign Up Free</Button>
              </Link>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
