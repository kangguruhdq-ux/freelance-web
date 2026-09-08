"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import { UserRole } from "@freelancehub/types";
import { useAuth } from "@/context/auth-context";
import { ShieldAlert, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, role, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const redirectUrl = pathname ? `/login?redirect=${encodeURIComponent(pathname)}` : "/login";
      router.push(redirectUrl);
    }
  }, [isLoading, isAuthenticated, router, pathname]);

  // Auto-redirect user with mismatched role to their own portal to avoid getting stuck
  React.useEffect(() => {
    if (!isLoading && isAuthenticated && allowedRoles && role && !allowedRoles.includes(role)) {
      const timer = setTimeout(() => {
        if (role === "CLIENT") router.replace("/client/dashboard");
        else if (role === "FREELANCER") router.replace("/freelancer/dashboard");
        else if (role === "ADMIN") router.replace("/admin/dashboard");
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [isLoading, isAuthenticated, allowedRoles, role, router]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-slate-500">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600 mb-3" />
        <p className="text-sm font-medium">Verifying authorization...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return (
      <div className="min-h-[65vh] flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full text-center p-8 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-card dark:shadow-none">
          <div className="h-12 w-12 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Redirecting to Your Workspace</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Your account is registered as a <span className="font-semibold text-slate-800 dark:text-slate-200">{role}</span>. We are redirecting you to your dedicated portal...
          </p>
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-brand-600 dark:text-brand-400 font-medium">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Navigating automatically...</span>
          </div>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
              className="gap-1.5"
            >
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </Button>
            <Button
              size="sm"
              onClick={() => {
                if (role === "CLIENT") router.push("/client/dashboard");
                else if (role === "FREELANCER") router.push("/freelancer/dashboard");
                else router.push("/admin/dashboard");
              }}
            >
              Go to My Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
