"use client";

import * as React from "react";
import { Menu, Activity, ShieldCheck } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Badge } from "@/components/ui/badge";

interface AdminTopbarProps {
  onToggleSidebar: () => void;
  title?: string;
  subtitle?: string;
}

export function AdminTopbar({ onToggleSidebar, title, subtitle }: AdminTopbarProps) {
  return (
    <header className="sticky top-0 z-30 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 px-4 sm:px-6 lg:px-8 flex items-center justify-between transition-colors">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-hidden"
          aria-label="Toggle admin navigation"
        >
          <Menu className="h-5 w-5" />
        </button>

        {title && (
          <div>
            <h1 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs text-slate-400 dark:text-slate-500 hidden sm:block">
                {subtitle}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[11px] tracking-tight">System Operational</span>
        </div>

        <Badge variant="outline" className="hidden md:flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800">
          <ShieldCheck className="h-3 w-3 text-brand-600 dark:text-brand-400" />
          <span>RBAC: Superadmin</span>
        </Badge>

        <ThemeToggle />
      </div>
    </header>
  );
}
