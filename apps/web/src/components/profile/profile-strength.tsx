"use client";

import * as React from "react";
import Link from "next/link";
import { CheckCircle2, Circle, ArrowRight, Sparkles, Camera, User, FileText, DollarSign, Wrench, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ProfileDataForStrength {
  avatarUrl?: string | null;
  headline?: string | null;
  bio?: string | null;
  hourlyRate?: number | null;
  skillsCount?: number;
  portfolioCount?: number;
}

interface ProfileStrengthProps {
  data: ProfileDataForStrength;
  onUploadAvatar?: () => void;
  onEditProfile?: () => void;
  className?: string;
}

export function ProfileStrength({
  data,
  onUploadAvatar,
  onEditProfile,
  className,
}: ProfileStrengthProps) {
  const items = [
    {
      id: "avatar",
      label: "Upload profile photo",
      completed: !!data.avatarUrl,
      weight: 20,
      icon: Camera,
      action: onUploadAvatar,
      href: undefined,
    },
    {
      id: "headline",
      label: "Add professional headline",
      completed: !!(data.headline && data.headline.trim().length > 0),
      weight: 15,
      icon: User,
      action: onEditProfile,
      href: undefined,
    },
    {
      id: "bio",
      label: "Write about me bio (min 30 chars)",
      completed: !!(data.bio && data.bio.trim().length >= 30),
      weight: 20,
      icon: FileText,
      action: onEditProfile,
      href: undefined,
    },
    {
      id: "hourlyRate",
      label: "Set competitive hourly rate",
      completed: typeof data.hourlyRate === "number" && data.hourlyRate > 0,
      weight: 15,
      icon: DollarSign,
      action: onEditProfile,
      href: undefined,
    },
    {
      id: "skills",
      label: "Add at least 3 core skills",
      completed: (data.skillsCount || 0) >= 3,
      weight: 15,
      icon: Wrench,
      action: onEditProfile,
      href: undefined,
    },
    {
      id: "portfolio",
      label: "Publish featured portfolio work",
      completed: (data.portfolioCount || 0) >= 1,
      weight: 15,
      icon: Briefcase,
      action: undefined,
      href: "#portfolio",
    },
  ];

  const totalCompletedWeight = items
    .filter((item) => item.completed)
    .reduce((sum, item) => sum + item.weight, 0);

  const percentage = Math.min(100, Math.max(0, totalCompletedWeight));

  const getStrengthTier = (pct: number) => {
    if (pct >= 100) return { label: "All-Star Profile", color: "text-emerald-600 dark:text-emerald-400" };
    if (pct >= 70) return { label: "Strong Profile", color: "text-brand-600 dark:text-brand-400" };
    if (pct >= 40) return { label: "Intermediate", color: "text-amber-600 dark:text-amber-400" };
    return { label: "Beginner", color: "text-slate-500 dark:text-slate-400" };
  };

  const tier = getStrengthTier(percentage);

  return (
    <div
      className={cn(
        "p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-card dark:shadow-none space-y-5",
        className
      )}
    >
      {/* Header & Percentage */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-brand-600 dark:text-brand-400" />
              Profile Strength
            </h3>
            <span className={cn("text-xs font-bold", tier.color)}>• {tier.label}</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Complete your profile to increase search visibility and win more contracts.
          </p>
        </div>

        <div className="text-right sm:self-auto self-start">
          <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {percentage}%
          </span>
          <span className="text-xs text-slate-400 dark:text-slate-500 ml-1">complete</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden relative shadow-inner">
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand-600 via-indigo-600 to-emerald-500 transition-all duration-700 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Checklist Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
        {items.map((item) => {
          const Icon = item.icon;
          const content = (
            <div
              className={cn(
                "flex items-center justify-between p-3 rounded-xl border text-xs transition-all duration-200",
                item.completed
                  ? "bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-300"
                  : "bg-slate-50/70 dark:bg-slate-850 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-brand-400 hover:bg-white dark:hover:bg-slate-800 cursor-pointer shadow-xs"
              )}
            >
              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                {item.completed ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                ) : (
                  <Circle className="h-4 w-4 text-slate-400 dark:text-slate-500 shrink-0" />
                )}
                <span className={cn("truncate font-medium", item.completed && "line-through opacity-80")}>
                  {item.label}
                </span>
              </div>

              {!item.completed && (
                <ArrowRight className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400 shrink-0" />
              )}
            </div>
          );

          if (item.href) {
            return (
              <Link key={item.id} href={item.href} className="block focus:outline-hidden">
                {content}
              </Link>
            );
          }

          if (item.action) {
            return (
              <button
                key={item.id}
                type="button"
                onClick={item.action}
                className="w-full text-left focus:outline-hidden"
              >
                {content}
              </button>
            );
          }

          return <div key={item.id}>{content}</div>;
        })}
      </div>
    </div>
  );
}
