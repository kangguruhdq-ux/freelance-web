"use client";

import * as React from "react";
import Link from "next/link";
import { X, ArrowRight, Briefcase, Users, Shield, Sparkles, Layers, LayoutDashboard, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/auth-context";

export interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const { user, isAuthenticated, logout } = useAuth();

  // Prevent background scrolling when mobile menu is active
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 w-full max-w-sm bg-white p-6 shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-6 border-b border-slate-100">
            <Link
              href="/"
              onClick={onClose}
              className="flex items-center gap-2.5 font-bold text-xl text-slate-900 tracking-tight"
            >
              <div className="h-9 w-9 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-sm shadow-brand-500/30">
                <Layers className="h-5 w-5" />
              </div>
              <span>Freelance<span className="text-brand-600">Hub</span></span>
            </Link>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              aria-label="Close menu"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* User Profile Info (if authenticated) */}
          {isAuthenticated && user && (
            <div className="py-4 border-b border-slate-100 mb-2">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-sm uppercase">
                  {user.name?.charAt(0) || "U"}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-slate-900 truncate">{user.name}</p>
                    <Badge variant="outline" className="text-[10px] font-bold px-1.5 py-0 uppercase">
                      {user.role}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <div className="py-4 space-y-1">
            <p className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Marketplace
            </p>
            <Link
              href="/#jobs"
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-3 rounded-lg text-base font-medium text-slate-700 hover:text-brand-600 hover:bg-brand-50/50 transition-colors"
            >
              <Briefcase className="h-5 w-5 text-slate-400" />
              Find Work
            </Link>
            <Link
              href="/#freelancers"
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-3 rounded-lg text-base font-medium text-slate-700 hover:text-brand-600 hover:bg-brand-50/50 transition-colors"
            >
              <Users className="h-5 w-5 text-slate-400" />
              Find Talent
            </Link>
            <Link
              href="/#how-it-works"
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-3 rounded-lg text-base font-medium text-slate-700 hover:text-brand-600 hover:bg-brand-50/50 transition-colors"
            >
              <Sparkles className="h-5 w-5 text-slate-400" />
              How It Works
            </Link>
            <Link
              href="/#security"
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-3 rounded-lg text-base font-medium text-slate-700 hover:text-brand-600 hover:bg-brand-50/50 transition-colors"
            >
              <Shield className="h-5 w-5 text-slate-400" />
              Escrow & Security
            </Link>
          </div>

          {/* Highlight banner in mobile menu */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 my-2">
            <span className="inline-block text-[11px] font-semibold text-brand-700 bg-brand-100/60 px-2 py-0.5 rounded-full mb-1">
              Zero Risk Escrow
            </span>
            <p className="text-xs text-slate-600 leading-relaxed">
              Every contract is backed by structured milestone protection. Funds only release when you approve work.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-6 border-t border-slate-100 space-y-3">
          {isAuthenticated ? (
            <>
              <Link href="/dashboard" onClick={onClose} className="w-full block">
                <Button className="w-full h-11 justify-center text-sm font-semibold gap-2">
                  <LayoutDashboard className="h-4 w-4" />
                  Go to Dashboard
                </Button>
              </Link>
              <Button
                variant="outline"
                onClick={() => {
                  logout();
                  onClose();
                }}
                className="w-full h-11 justify-center text-sm font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 gap-2 border-rose-200"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Link href="/login" onClick={onClose} className="w-full block">
                <Button variant="outline" className="w-full h-11 justify-center text-sm font-medium">
                  Log in
                </Button>
              </Link>
              <Link href="/register" onClick={onClose} className="w-full block">
                <Button className="w-full h-11 justify-center text-sm font-semibold gap-2">
                  Sign up free
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
