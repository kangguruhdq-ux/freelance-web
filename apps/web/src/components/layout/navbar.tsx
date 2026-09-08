"use client";

import * as React from "react";
import Link from "next/link";
import { Layers, Menu, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MobileNav } from "./mobile-nav";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header
        className={`sticky top-0 z-40 w-full transition-all duration-200 ${
          scrolled
            ? "border-b border-slate-200/80 bg-white/95 backdrop-blur-md shadow-subtle"
            : "border-b border-transparent bg-white/80 backdrop-blur-sm"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-8">
            <Link
              href="/"
              className="flex items-center gap-2.5 font-bold text-xl sm:text-2xl text-slate-900 tracking-tight transition-transform active:scale-95"
            >
              <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-sm shadow-brand-500/25">
                <Layers className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <span>
                Freelance<span className="text-brand-600">Hub</span>
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-6">
              <Link
                href="#jobs"
                className="text-sm font-medium text-slate-600 hover:text-brand-600 transition-colors"
              >
                Find Work
              </Link>
              <Link
                href="#freelancers"
                className="text-sm font-medium text-slate-600 hover:text-brand-600 transition-colors"
              >
                Find Talent
              </Link>
              <Link
                href="#how-it-works"
                className="text-sm font-medium text-slate-600 hover:text-brand-600 transition-colors"
              >
                How It Works
              </Link>
              <Link
                href="#security"
                className="text-sm font-medium text-slate-600 hover:text-brand-600 transition-colors"
              >
                Escrow & Security
              </Link>
            </nav>
          </div>

          {/* Desktop Right Actions */}
          <div className="hidden sm:flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="font-medium text-slate-700">
                Log in
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="gap-1.5 font-semibold">
                Sign up free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {/* Mobile Actions: Compact Sign Up & Hamburger */}
          <div className="flex sm:hidden items-center gap-2">
            <Link href="/register">
              <Button size="sm" className="text-xs h-8 px-3">
                Sign up
              </Button>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              aria-label="Open mobile menu"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile navigation drawer */}
      <MobileNav
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
    </>
  );
}
