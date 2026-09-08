"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Loader2 } from "lucide-react";

export default function DashboardRedirectPage() {
  const { user, role, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated || !user) {
        router.push("/login");
      } else if (role === "CLIENT") {
        router.push("/client/dashboard");
      } else if (role === "FREELANCER") {
        router.push("/freelancer/dashboard");
      } else if (role === "ADMIN") {
        router.push("/admin/dashboard");
      } else {
        router.push("/");
      }
    }
  }, [isLoading, isAuthenticated, user, role, router]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-slate-500">
      <Loader2 className="h-8 w-8 animate-spin text-brand-600 mb-3" />
      <p className="text-sm font-medium">Navigating to your workspace...</p>
    </div>
  );
}
