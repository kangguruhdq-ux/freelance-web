"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { ArrowLeft, Briefcase, Plus, ShieldCheck, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api-client";

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
}

export default function NewJobPage() {
  const router = useRouter();
  const [categories, setCategories] = React.useState<CategoryOption[]>([]);
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [categoryId, setCategoryId] = React.useState("");
  const [budget, setBudget] = React.useState("");
  const [budgetType, setBudgetType] = React.useState("FIXED");
  const [experienceLevel, setExperienceLevel] = React.useState("INTERMEDIATE");
  const [locationType, setLocationType] = React.useState("REMOTE");
  const [duration, setDuration] = React.useState("1 to 3 months");
  const [submitting, setSubmitting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState("");

  React.useEffect(() => {
    apiFetch("/profiles/meta/categories")
      .then((data) => {
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          setCategories(data.data);
          setCategoryId(data.data[0].id);
        }
      })
      .catch((err) => console.error("Failed to load categories:", err));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSubmitting(true);

    try {
      const json = await apiFetch("/jobs", {
        method: "POST",
        body: JSON.stringify({
          title,
          description,
          categoryId,
          budget: parseFloat(budget),
          budgetType,
          experienceLevel,
          locationType,
          duration,
        }),
      });

      if (!json.success) {
        setErrorMsg(json.error || "Failed to post job");
        return;
      }

      router.push(`/jobs/${json.job.id}`);
    } catch (err: any) {
      setErrorMsg(err.message || "Network error posting job");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={["CLIENT"]}>
      <div className="min-h-screen bg-slate-50/50 py-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <Link href="/client/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-brand-600 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Client Workspace
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Post a New Project</h1>
              <p className="text-sm text-slate-500 mt-1">
                Define deliverables, target budget, and find top talent with escrow protection.
              </p>
            </div>
            <span className="text-xs text-emerald-600 font-medium flex items-center gap-1.5 self-start sm:self-auto bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
              <ShieldCheck className="h-4 w-4" /> Milestone Escrow Active
            </span>
          </div>

          <Card className="p-6 sm:p-8 bg-white border-slate-200 shadow-card">
            <form onSubmit={handleSubmit} className="space-y-6">
              {errorMsg && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                  {errorMsg}
                </div>
              )}

              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Project Title *
                </label>
                <Input
                  required
                  minLength={5}
                  placeholder="e.g. Senior Full-Stack Next.js & Node.js Engineer for SaaS Platform"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-11"
                />
                <p className="text-[11px] text-slate-400">Keep it clear and specific to attract relevant specialists.</p>
              </div>

              {/* Category & Budget Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Category *
                  </label>
                  <select
                    required
                    className="w-full h-11 px-3 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Estimated Budget ($ USD) *
                  </label>
                  <Input
                    type="number"
                    min="1"
                    required
                    placeholder="e.g. 3500"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="h-11"
                  />
                </div>
              </div>

              {/* Parameters Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Budget Type
                  </label>
                  <select
                    className="w-full h-11 px-3 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    value={budgetType}
                    onChange={(e) => setBudgetType(e.target.value)}
                  >
                    <option value="FIXED">Fixed Price (Milestones)</option>
                    <option value="HOURLY">Hourly Rate</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Experience Level
                  </label>
                  <select
                    className="w-full h-11 px-3 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    value={experienceLevel}
                    onChange={(e) => setExperienceLevel(e.target.value)}
                  >
                    <option value="ENTRY">Entry Level</option>
                    <option value="INTERMEDIATE">Intermediate</option>
                    <option value="EXPERT">Expert</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Location Type
                  </label>
                  <select
                    className="w-full h-11 px-3 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    value={locationType}
                    onChange={(e) => setLocationType(e.target.value)}
                  >
                    <option value="REMOTE">100% Remote</option>
                    <option value="HYBRID">Hybrid</option>
                    <option value="ONSITE">Onsite</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Project Description &amp; Scope *
                </label>
                <textarea
                  rows={8}
                  required
                  minLength={20}
                  className="w-full p-4 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 leading-relaxed resize-y"
                  placeholder="Detail the scope of work, technical requirements, deliverables, milestones, and expected timeline..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
                <p className="text-[11px] text-slate-400">Minimum 20 characters.</p>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <Link href="/client/dashboard">
                  <Button variant="outline" type="button">
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" disabled={submitting} className="gap-2 font-semibold">
                  {submitting ? "Publishing Project..." : "Publish Project"}
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
