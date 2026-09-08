"use client";

import * as React from "react";
import Link from "next/link";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useAuth } from "@/context/auth-context";
import { Briefcase, FileText, CheckCircle2, DollarSign, Plus, Search, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function ClientDashboardPage() {
  const { user } = useAuth();

  return (
    <ProtectedRoute allowedRoles={["CLIENT"]}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/80">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="default" className="font-semibold text-xs">
                CLIENT PORTAL
              </Badge>
              <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5" /> Escrow Verified
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Welcome back, {user?.name}
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {user?.email} • Manage your active job postings, contract milestones, and talent proposals
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/#jobs">
              <Button variant="outline" size="sm" className="gap-1.5 font-semibold">
                <Search className="h-4 w-4" />
                Browse Talent
              </Button>
            </Link>
            <Button size="sm" className="gap-1.5 font-semibold">
              <Plus className="h-4 w-4" />
              Post a Project
            </Button>
          </div>
        </div>

        {/* Client KPI Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-card">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Active Jobs</span>
              <Briefcase className="h-4 w-4 text-brand-600" />
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">4</p>
            <p className="text-xs text-emerald-600 font-medium mt-1">2 receiving proposals</p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-card">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Pending Proposals</span>
              <FileText className="h-4 w-4 text-indigo-600" />
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">12</p>
            <p className="text-xs text-slate-500 mt-1">From vetted talent</p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-card">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Active Contracts</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">3</p>
            <p className="text-xs text-slate-500 mt-1">Milestones in review</p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-card">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Invested</span>
              <DollarSign className="h-4 w-4 text-amber-600" />
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">$18,400</p>
            <p className="text-xs text-slate-500 mt-1">100% escrow backed</p>
          </div>
        </div>

        {/* Quick Action Activity Banner */}
        <div className="p-6 rounded-2xl bg-brand-50/60 border border-brand-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Milestone Deliverable Pending Review</h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
              Sophia Chen has submitted deliverables for &ldquo;Architecture Design &amp; Schema Definition&rdquo;. Review deliverables to release escrow.
            </p>
          </div>
          <Button size="sm" className="font-semibold text-xs shrink-0">
            Review Submission
          </Button>
        </div>
      </div>
    </ProtectedRoute>
  );
}
