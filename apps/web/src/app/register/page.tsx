"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Layers, ArrowRight, Loader2, AlertCircle, Briefcase, UserCheck, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/auth-context";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");
  const { register, isAuthenticated, role, isLoading } = useAuth();

  const [roleSelection, setRoleSelection] = React.useState<"CLIENT" | "FREELANCER">("FREELANCER");
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // If already authenticated, redirect
  React.useEffect(() => {
    if (!isLoading && isAuthenticated && role) {
      if (redirect && redirect.startsWith("/") && !redirect.startsWith("//")) {
        router.push(redirect);
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
  }, [isLoading, isAuthenticated, role, redirect, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim() || name.trim().length < 2) {
      setErrorMessage("Please enter your full name (minimum 2 characters).");
      return;
    }

    if (!email.trim()) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters long.");
      return;
    }

    if (!/[A-Z]/.test(password)) {
      setErrorMessage("Password must contain at least one uppercase letter.");
      return;
    }

    if (!/[0-9]/.test(password) && !/[^a-zA-Z0-9]/.test(password)) {
      setErrorMessage("Password must contain at least one number or special character.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match. Please re-enter.");
      return;
    }

    setIsSubmitting(true);
    const result = await register({
      name: name.trim(),
      email: email.trim(),
      password,
      role: roleSelection,
    });
    setIsSubmitting(false);

    if (!result.success) {
      setErrorMessage(result.error || "Registration failed. Please check your information.");
    } else {
      if (redirect && redirect.startsWith("/") && !redirect.startsWith("//")) {
        router.push(redirect);
      }
    }
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center px-4 py-12 bg-slate-50/50 dark:bg-slate-950 transition-colors">
      <div className="w-full max-w-lg space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2.5 font-bold text-2xl text-slate-900 dark:text-white tracking-tight"
          >
            <div className="h-10 w-10 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-sm shadow-brand-500/25">
              <Layers className="h-5 w-5" />
            </div>
            <span>
              Freelance<span className="text-brand-600 dark:text-brand-400">Hub</span>
            </span>
          </Link>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Create your account
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Join thousands of professionals moving work forward with milestone escrow
          </p>
        </div>

        {/* Card Form */}
        <div className="bg-white dark:bg-slate-900 p-7 sm:p-8 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-card">
          <form onSubmit={handleSubmit} className="space-y-5">
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs sm:text-sm flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Role Selection Cards */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                I want to:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRoleSelection("FREELANCER")}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    roleSelection === "FREELANCER"
                      ? "border-brand-600 dark:border-brand-500 bg-brand-50/50 dark:bg-brand-950/40 ring-2 ring-brand-500/20"
                      : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <UserCheck className={`h-4 w-4 ${roleSelection === "FREELANCER" ? "text-brand-600 dark:text-brand-400" : "text-slate-400"}`} />
                    {roleSelection === "FREELANCER" && <CheckCircle2 className="h-4 w-4 text-brand-600 dark:text-brand-400" />}
                  </div>
                  <span className="block text-sm font-bold text-slate-900 dark:text-white">Work as a Freelancer</span>
                  <span className="block text-xs text-slate-500 dark:text-slate-400 mt-0.5">Find projects &amp; get paid</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRoleSelection("CLIENT")}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    roleSelection === "CLIENT"
                      ? "border-brand-600 dark:border-brand-500 bg-brand-50/50 dark:bg-brand-950/40 ring-2 ring-brand-500/20"
                      : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <Briefcase className={`h-4 w-4 ${roleSelection === "CLIENT" ? "text-brand-600 dark:text-brand-400" : "text-slate-400"}`} />
                    {roleSelection === "CLIENT" && <CheckCircle2 className="h-4 w-4 text-brand-600 dark:text-brand-400" />}
                  </div>
                  <span className="block text-sm font-bold text-slate-900 dark:text-white">Hire Talent as Client</span>
                  <span className="block text-xs text-slate-500 dark:text-slate-400 mt-0.5">Post jobs &amp; build teams</span>
                </button>
              </div>
            </div>

            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Full Name
              </label>
              <Input
                type="text"
                placeholder="e.g. Jordan Miller"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSubmitting}
                required
                className="h-11 dark:bg-slate-800 dark:border-slate-700"
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Work Email Address
              </label>
              <Input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
                required
                autoComplete="email"
                className="h-11 dark:bg-slate-800 dark:border-slate-700"
              />
            </div>

            {/* Passwords */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <Input
                  type="password"
                  placeholder="Min 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                  required
                  autoComplete="new-password"
                  className="h-11 dark:bg-slate-800 dark:border-slate-700"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Confirm Password
                </label>
                <Input
                  type="password"
                  placeholder="Repeat password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isSubmitting}
                  required
                  autoComplete="new-password"
                  className="h-11 dark:bg-slate-800 dark:border-slate-700"
                />
              </div>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              By creating an account, you agree to FreelanceHub&apos;s Terms of Service and Privacy Policy. Escrow protection is automatically enabled on all contracts.
            </p>

            <Button
              type="submit"
              size="lg"
              disabled={isSubmitting}
              className="w-full h-11 font-semibold gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Footer link */}
        <p className="text-center text-sm text-slate-600 dark:text-slate-400">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-brand-600 dark:text-brand-400 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-[85vh] flex items-center justify-center bg-slate-50/50 dark:bg-slate-950">
          <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
        </div>
      }
    >
      <RegisterForm />
    </React.Suspense>
  );
}
