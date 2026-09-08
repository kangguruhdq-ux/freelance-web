"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Layers, ArrowRight, Loader2, AlertCircle, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, role, isLoading } = useAuth();

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // If already authenticated, redirect to appropriate dashboard
  React.useEffect(() => {
    if (!isLoading && isAuthenticated && role) {
      if (role === "CLIENT") router.push("/client/dashboard");
      else if (role === "FREELANCER") router.push("/freelancer/dashboard");
      else if (role === "ADMIN") router.push("/admin/dashboard");
      else router.push("/");
    }
  }, [isLoading, isAuthenticated, role, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage("Please enter both your email address and password.");
      return;
    }

    setIsSubmitting(true);
    const result = await login({ email: email.trim(), password });
    setIsSubmitting(false);

    if (!result.success) {
      setErrorMessage(result.error || "Invalid email or password.");
    }
  };

  const handleQuickLogin = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("FreelanceHub2026!");
    setErrorMessage(null);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-slate-50/50">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2.5 font-bold text-2xl text-slate-900 tracking-tight"
          >
            <div className="h-10 w-10 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-sm shadow-brand-500/25">
              <Layers className="h-5 w-5" />
            </div>
            <span>
              Freelance<span className="text-brand-600">Hub</span>
            </span>
          </Link>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Welcome back
          </h1>
          <p className="text-sm text-slate-600">
            Log in to manage your jobs, proposals, and contracts
          </p>
        </div>

        {/* Card Form */}
        <div className="bg-white p-7 sm:p-8 rounded-2xl border border-slate-200/90 shadow-card">
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-800 text-xs sm:text-sm flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                Email address
              </label>
              <Input
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
                required
                autoComplete="email"
                className="h-11"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Password
                </label>
                <span className="text-xs text-brand-600 hover:text-brand-700 cursor-pointer font-medium">
                  Forgot password?
                </span>
              </div>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                  required
                  autoComplete="current-password"
                  className="h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={isSubmitting}
              className="w-full h-11 font-semibold gap-2 mt-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          {/* Demo Accounts Quick-Fill */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2.5 text-center">
              Quick Login Demo Profiles
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin("sarah.jenkins@nexahealth.io")}
                className="px-2.5 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-left transition-colors"
              >
                <span className="block text-[11px] font-bold text-slate-800 truncate">Sarah (Client)</span>
                <span className="block text-[10px] text-slate-500 truncate">NexaHealth VP</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin("sophia.chen@freelancehub.pro")}
                className="px-2.5 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-left transition-colors"
              >
                <span className="block text-[11px] font-bold text-slate-800 truncate">Sophia (Freelancer)</span>
                <span className="block text-[10px] text-slate-500 truncate">Next.js Lead</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin("alexander.vance@freelancehub.dev")}
                className="px-2.5 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-left transition-colors"
              >
                <span className="block text-[11px] font-bold text-slate-800 truncate">Alexander (Admin)</span>
                <span className="block text-[10px] text-slate-500 truncate">Platform Lead</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400 text-center mt-2">
              Password for all demo accounts: <code className="text-slate-600 font-mono">FreelanceHub2026!</code>
            </p>
          </div>
        </div>

        {/* Footer link */}
        <p className="text-center text-sm text-slate-600">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-semibold text-brand-600 hover:text-brand-700">
            Sign up free
          </Link>
        </p>
      </div>
    </div>
  );
}
