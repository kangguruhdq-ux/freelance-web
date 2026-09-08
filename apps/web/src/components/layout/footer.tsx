"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Layers, Github, Twitter, Linkedin, ShieldCheck } from "lucide-react";

export function Footer() {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;

  return (
    <footer className="bg-slate-900 dark:bg-slate-950 text-slate-300 border-t border-slate-800 dark:border-slate-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand & Mission */}
          <div className="col-span-2 lg:col-span-2 space-y-4">
            <Link
              href="/"
              className="flex items-center gap-2.5 font-bold text-xl text-white tracking-tight"
            >
              <div className="h-9 w-9 rounded-xl bg-brand-500 flex items-center justify-center text-white">
                <Layers className="h-5 w-5" />
              </div>
              <span>
                Freelance<span className="text-brand-400">Hub</span>
              </span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
              The modern freelance marketplace connecting ambitious companies with world-class engineering, design, and growth talent. Built with escrow-backed contracts and real-time collaboration.
            </p>
            <div className="flex items-center gap-2 pt-1 text-xs text-slate-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>All platform systems operational</span>
            </div>
          </div>

          {/* For Clients */}
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-wider text-white">
              For Clients
            </p>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <Link href="#jobs" className="hover:text-white transition-colors">
                  How to Hire
                </Link>
              </li>
              <li>
                <Link href="#freelancers" className="hover:text-white transition-colors">
                  Explore Talent
                </Link>
              </li>
              <li>
                <Link href="#security" className="hover:text-white transition-colors">
                  Escrow Protection
                </Link>
              </li>
              <li>
                <Link href="#how-it-works" className="hover:text-white transition-colors">
                  Project Catalog
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-white transition-colors">
                  Post a Project
                </Link>
              </li>
            </ul>
          </div>

          {/* For Freelancers */}
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-wider text-white">
              For Talent
            </p>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <Link href="#jobs" className="hover:text-white transition-colors">
                  Find Work
                </Link>
              </li>
              <li>
                <Link href="#how-it-works" className="hover:text-white transition-colors">
                  Direct Contracts
                </Link>
              </li>
              <li>
                <Link href="#security" className="hover:text-white transition-colors">
                  Guaranteed Payouts
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-white transition-colors">
                  Join as Freelancer
                </Link>
              </li>
              <li>
                <Link href="#testimonials" className="hover:text-white transition-colors">
                  Success Stories
                </Link>
              </li>
            </ul>
          </div>

          {/* Platform & Trust */}
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-wider text-white">
              Trust & Legal
            </p>
            <ul className="space-y-2 text-sm text-slate-400">
              <li className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-brand-400" />
                <Link href="#security" className="hover:text-white transition-colors">
                  Trust & Security
                </Link>
              </li>
              <li>
                <span className="text-slate-400 hover:text-white cursor-pointer transition-colors">
                  Privacy Policy
                </span>
              </li>
              <li>
                <span className="text-slate-400 hover:text-white cursor-pointer transition-colors">
                  Terms of Service
                </span>
              </li>
              <li>
                <span className="text-slate-400 hover:text-white cursor-pointer transition-colors">
                  Dispute Resolution
                </span>
              </li>
              <li>
                <span className="text-slate-400 hover:text-white cursor-pointer transition-colors">
                  Cookie Preferences
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>
            © {new Date().getFullYear()} FreelanceHub Inc. Work smarter. Hire better. All rights reserved.
          </p>
          <div className="flex items-center gap-5 text-slate-400">
            <a
              href="https://github.com/kangguruhdq-ux/freelance-web"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
              aria-label="GitHub repository"
            >
              <Github className="h-4 w-4" />
            </a>
            <span className="hover:text-white cursor-pointer transition-colors" aria-label="Twitter">
              <Twitter className="h-4 w-4" />
            </span>
            <span className="hover:text-white cursor-pointer transition-colors" aria-label="LinkedIn">
              <Linkedin className="h-4 w-4" />
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
