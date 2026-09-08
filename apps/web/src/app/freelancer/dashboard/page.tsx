"use client";

import * as React from "react";
import Link from "next/link";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useAuth } from "@/context/auth-context";
import { FileText, CheckCircle2, DollarSign, Search, Star, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function FreelancerDashboardPage() {
  const { user } = useAuth();

  return (
    <ProtectedRoute allowedRoles={["FREELANCER"]}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/80">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="secondary" className="font-semibold text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                FREELANCER WORKSPACE
              </Badge>
              <span className="text-xs text-amber-600 font-medium flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5" /> Top Rated Talent
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Welcome back, {user?.name}
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {user?.email} • Track your active proposals, live milestones, and secure earnings
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/#jobs">
              <Button size="sm" className="gap-1.5 font-semibold">
                <Search className="h-4 w-4" />
                Find New Projects
              </Button>
            </Link>
          </div>
        </div>

        {/* Freelancer KPI Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-card">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Active Contracts</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">2</p>
            <p className="text-xs text-emerald-600 font-medium mt-1">Both on schedule</p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-card">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Submitted Proposals</span>
              <FileText className="h-4 w-4 text-indigo-600" />
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">5</p>
            <p className="text-xs text-slate-500 mt-1">2 under client review</p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-card">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Earned (30d)</span>
              <DollarSign className="h-4 w-4 text-brand-600" />
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">$8,250</p>
            <p className="text-xs text-slate-500 mt-1">Direct to bank transfer</p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-card">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Rating Score</span>
              <Star className="h-4 w-4 text-amber-500 fill-amber-400" />
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">5.0 / 5.0</p>
            <p className="text-xs text-emerald-600 font-medium mt-1">100% Job Success</p>
          </div>
        </div>

        {/* Milestone Submission Card */}
        <div className="p-6 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-medium text-slate-300">Milestone in progress</span>
            </div>
            <h3 className="text-base font-bold text-white">Full-Stack SaaS MVP Development — Milestone 2</h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Due in 4 days. Escrow amount: $2,500. Ensure all code tests pass before submitting deliverable.
            </p>
          </div>
          <Button variant="secondary" size="sm" className="font-semibold text-xs shrink-0 bg-white text-slate-900 hover:bg-slate-100">
            Submit Deliverables
          </Button>
        </div>
      </div>
    </ProtectedRoute>
  );
}
