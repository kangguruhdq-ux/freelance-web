"use client";

import * as React from "react";
import Link from "next/link";
import { Layers, Menu, ArrowRight, LayoutDashboard, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/auth-context";
import { MobileNav } from "./mobile-nav";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);
  const { user, isAuthenticated, logout } = useAuth();

  React.useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const getRoleBadgeVariant = (role?: string) => {
    switch (role) {
      case "ADMIN":
        return "destructive";
      case "FREELANCER":
        return "secondary";
      default:
        return "default";
    }
  };

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
                href="/#jobs"
                className="text-sm font-medium text-slate-600 hover:text-brand-600 transition-colors"
              >
                Find Work
              </Link>
              <Link
                href="/#freelancers"
                className="text-sm font-medium text-slate-600 hover:text-brand-600 transition-colors"
              >
                Find Talent
              </Link>
              <Link
                href="/#how-it-works"
                className="text-sm font-medium text-slate-600 hover:text-brand-600 transition-colors"
              >
                How It Works
              </Link>
              <Link
                href="/#security"
                className="text-sm font-medium text-slate-600 hover:text-brand-600 transition-colors"
              >
                Escrow & Security
              </Link>
            </nav>
          </div>

          {/* Desktop Right Actions */}
          <div className="hidden sm:flex items-center gap-3">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-3">
                <Link href="/dashboard">
                  <Button variant="outline" size="sm" className="gap-2 font-medium">
                    <LayoutDashboard className="h-4 w-4 text-brand-600" />
                    <span>Dashboard</span>
                  </Button>
                </Link>

                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200">
                  <div className="h-6 w-6 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-bold uppercase">
                    {user.name?.charAt(0) || "U"}
                  </div>
                  <span className="text-xs font-semibold text-slate-800 max-w-[120px] truncate">
                    {user.name}
                  </span>
                  <Badge
                    variant={getRoleBadgeVariant(user.role) as any}
                    className="text-[10px] uppercase font-bold py-0 px-1.5"
                  >
                    {user.role}
                  </Badge>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => logout()}
                  className="text-slate-500 hover:text-rose-600 gap-1.5 px-2.5"
                  title="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden md:inline text-xs">Logout</span>
                </Button>
              </div>
            ) : (
              <>
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
              </>
            )}
          </div>

          {/* Mobile Actions */}
          <div className="flex sm:hidden items-center gap-2">
            {isAuthenticated ? (
              <Link href="/dashboard">
                <Button size="sm" variant="outline" className="text-xs h-8 px-2.5 gap-1.5">
                  <LayoutDashboard className="h-3.5 w-3.5 text-brand-600" />
                  Dashboard
                </Button>
              </Link>
            ) : (
              <Link href="/register">
                <Button size="sm" className="text-xs h-8 px-3">
                  Sign up
                </Button>
              </Link>
            )}
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
