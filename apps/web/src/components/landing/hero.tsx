"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Sparkles, ArrowRight, ShieldCheck, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

const POPULAR_TAGS = [
  "Next.js",
  "Product Design",
  "Kubernetes",
  "AI & LLMs",
  "DevOps",
  "TypeScript",
];

export function Hero() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = React.useState("");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/jobs?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push("/jobs");
    }
  };

  return (
    <section className="relative overflow-hidden pt-8 pb-16 sm:pt-14 sm:pb-24 lg:pt-20 lg:pb-32 bg-gradient-to-b from-slate-50/70 via-white to-white">
      {/* Background ambient accents */}
      <div className="absolute inset-x-0 top-0 h-96 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(37,99,235,0.09),rgba(255,255,255,0))] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-3xl mx-auto text-center space-y-6 sm:space-y-8">
          {/* Tagline / Pill Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-200/80 bg-brand-50/70 px-3.5 py-1.5 text-xs sm:text-sm font-medium text-brand-700 shadow-subtle animate-in fade-in slide-in-from-top duration-300">
            <Sparkles className="h-3.5 w-3.5 text-brand-600" />
            <span>Escrow-Protected Freelance Marketplace</span>
            <span className="h-1 w-1 rounded-full bg-brand-400" />
            <span className="text-brand-800 font-semibold">Zero upfront risk</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.12]">
            Work smarter. <br />
            <span className="bg-gradient-to-r from-brand-600 to-indigo-600 bg-clip-text text-transparent">
              Hire better.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg lg:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto">
            FreelanceHub connects ambitious businesses with vetted independent talent. Collaborate with confidence using milestone escrow, real-time messaging, and verified portfolios.
          </p>

          {/* Search Interface */}
          <form
            onSubmit={handleSearchSubmit}
            className="p-2 sm:p-2.5 rounded-2xl bg-white border border-slate-200/90 shadow-card hover:shadow-card-hover transition-all max-w-2xl mx-auto"
          >
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative flex-1 flex items-center pl-3">
                <Search className="h-5 w-5 text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Try 'Next.js developer', 'Figma designer', 'DevOps'..."
                  className="w-full px-3 py-2 text-sm sm:text-base text-slate-900 placeholder:text-slate-400 bg-transparent border-none focus:outline-none"
                />
              </div>
              <Button type="submit" size="lg" className="sm:w-auto w-full gap-2 font-semibold">
                Search Talent
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </form>

          {/* Popular Tag Quick-Filters */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-xs text-slate-500">
            <span className="font-medium text-slate-700">Popular:</span>
            {POPULAR_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setSearchQuery(tag)}
                className="px-2.5 py-1 rounded-md bg-slate-100/80 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors font-medium cursor-pointer"
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Action CTAs */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <Link href="/jobs" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto px-7 font-semibold">
                Explore Projects
              </Button>
            </Link>
            <Link href="/client/jobs/new" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto px-7 font-semibold">
                Post a Project
              </Button>
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="pt-6 border-t border-slate-100 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>Milestone Escrow Protection</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
              <span>4.9/5 from 18,000+ reviews</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>Instant Payout Settlements</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
