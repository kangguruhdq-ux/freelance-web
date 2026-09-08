"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Layers, Menu, ArrowRight, LayoutDashboard, LogOut, User, Plus, Camera, ChevronDown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Avatar, AvatarStatus } from "@/components/ui/avatar";
import { AvatarUploadModal } from "@/components/ui/avatar-upload-modal";
import { NotificationDropdown } from "./notification-dropdown";
import { useAuth } from "@/context/auth-context";
import { MobileNav } from "./mobile-nav";

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [avatarModalOpen, setAvatarModalOpen] = React.useState(false);
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const userMenuRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    if (userMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [userMenuOpen]);

  React.useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Do not render consumer navbar on admin dashboard pages
  if (pathname?.startsWith("/admin")) return null;

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "destructive";
      case "CLIENT":
        return "default";
      case "FREELANCER":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <>
      <header
        className={`sticky top-0 z-40 w-full transition-all duration-200 ${
          scrolled
            ? "border-b border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-subtle"
            : "border-b border-transparent bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Logo */}
          <div className="flex items-center gap-8">
            <Link
              href="/"
              className="flex items-center gap-2.5 font-bold text-xl text-slate-900 dark:text-white tracking-tight hover:opacity-90 transition-opacity"
            >
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
                <Layers className="h-5 w-5" />
              </div>
              <span>
                Freelance<span className="text-brand-600 dark:text-brand-400">Hub</span>
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-6">
              {user?.role === "CLIENT" ? (
                <>
                  <Link
                    href="/client/dashboard"
                    className="text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                  >
                    My Projects
                  </Link>
                  <Link
                    href="/jobs"
                    className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                  >
                    Browse Marketplace
                  </Link>
                  <Link
                    href="/#freelancers"
                    className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                  >
                    Find Talent
                  </Link>
                  <Link
                    href="/#security"
                    className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                  >
                    Escrow Protection
                  </Link>
                </>
              ) : user?.role === "FREELANCER" ? (
                <>
                  <Link
                    href="/jobs"
                    className="text-sm font-semibold text-brand-600 dark:text-brand-400 transition-colors"
                  >
                    Find Work
                  </Link>
                  <Link
                    href="/freelancer/dashboard"
                    className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                  >
                    My Proposals &amp; Contracts
                  </Link>
                  <Link
                    href="/#how-it-works"
                    className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                  >
                    How It Works
                  </Link>
                  <Link
                    href="/#security"
                    className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                  >
                    Guaranteed Payouts
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/jobs"
                    className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                  >
                    Find Work
                  </Link>
                  <Link
                    href="/#freelancers"
                    className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                  >
                    Find Talent
                  </Link>
                  <Link
                    href="/#how-it-works"
                    className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                  >
                    How It Works
                  </Link>
                  <Link
                    href="/#security"
                    className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                  >
                    Escrow &amp; Security
                  </Link>
                </>
              )}
            </nav>
          </div>

          {/* Desktop Right Actions */}
          <div className="hidden sm:flex items-center gap-3">
            <ThemeToggle />

            {isAuthenticated && user ? (
              <div className="flex items-center gap-3">
                {/* Notifications Dropdown */}
                <NotificationDropdown />

                {user.role === "CLIENT" && (
                  <Link href="/client/jobs/new">
                    <Button size="sm" className="gap-1.5 font-bold text-xs bg-brand-600 hover:bg-brand-700 text-white shadow-sm shadow-brand-500/25">
                      <Plus className="h-3.5 w-3.5" />
                      Post a Project
                    </Button>
                  </Link>
                )}

                <Link href="/dashboard">
                  <Button variant="outline" size="sm" className="gap-2 font-medium">
                    <LayoutDashboard className="h-4 w-4 text-brand-600" />
                    <span>Dashboard</span>
                  </Button>
                </Link>

                {/* User Avatar & Menu Dropdown */}
                <div className="relative inline-block" ref={userMenuRef}>
                  <button
                    type="button"
                    onClick={() => setUserMenuOpen((prev) => !prev)}
                    className="flex items-center gap-2.5 p-1 pl-1.5 pr-2.5 rounded-full bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 transition-all duration-150 focus:outline-hidden"
                    aria-expanded={userMenuOpen}
                    aria-label="User menu"
                  >
                    <Avatar
                      src={user.avatarUrl}
                      fallback={user.name}
                      size="sm"
                      status={
                        user.role === "FREELANCER"
                          ? (user.profile?.availability?.toLowerCase() as AvatarStatus) || "available"
                          : "online"
                      }
                    />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 max-w-[120px] truncate">
                      {user.name}
                    </span>
                    <Badge
                      variant={getRoleBadgeVariant(user.role) as any}
                      className="text-[10px] uppercase font-bold py-0 px-1.5"
                    >
                      {user.role}
                    </Badge>
                    <ChevronDown className="h-3 w-3 text-slate-400" />
                  </button>

                  {userMenuOpen && (
                    <div
                      role="menu"
                      className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-50 p-2 space-y-1 animate-in fade-in zoom-in-95 duration-150"
                    >
                      {/* User Info Header */}
                      <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                        <Avatar
                          src={user.avatarUrl}
                          fallback={user.name}
                          size="md"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{user.name}</p>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">{user.email}</p>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <button
                        type="button"
                        onClick={() => {
                          setUserMenuOpen(false);
                          setAvatarModalOpen(true);
                        }}
                        className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Camera className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                        <span>Change Profile Photo</span>
                      </button>

                      {user.role === "FREELANCER" && (
                        <Link
                          href={`/freelancers/${user.id}`}
                          onClick={() => setUserMenuOpen(false)}
                          className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <User className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                          <span>View Public Profile</span>
                        </Link>
                      )}

                      <Link
                        href="/dashboard"
                        onClick={() => setUserMenuOpen(false)}
                        className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <LayoutDashboard className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                        <span>Workspace Dashboard</span>
                      </Link>

                      <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                        <button
                          type="button"
                          onClick={() => {
                            setUserMenuOpen(false);
                            logout();
                          }}
                          className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        >
                          <LogOut className="h-4 w-4" />
                          <span>Sign out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="font-medium text-slate-700 dark:text-slate-200">
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
            <ThemeToggle />

            {isAuthenticated && user ? (
              <>
                <NotificationDropdown />
                <button
                  type="button"
                  onClick={() => setAvatarModalOpen(true)}
                  aria-label="Change profile photo"
                >
                  <Avatar
                    src={user.avatarUrl}
                    fallback={user.name}
                    size="xs"
                  />
                </button>
                <Link href="/dashboard">
                  <Button size="sm" variant="outline" className="text-xs h-8 px-2.5 gap-1.5">
                    <LayoutDashboard className="h-3.5 w-3.5 text-brand-600" />
                    Dashboard
                  </Button>
                </Link>
              </>
            ) : (
              <Link href="/register">
                <Button size="sm" className="text-xs h-8 px-3">
                  Sign up
                </Button>
              </Link>
            )}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
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

      {/* Profile Photo Upload Modal */}
      {user && (
        <AvatarUploadModal
          isOpen={avatarModalOpen}
          onClose={() => setAvatarModalOpen(false)}
          currentAvatarUrl={user.avatarUrl}
          userName={user.name}
        />
      )}
    </>
  );
}
