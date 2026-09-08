"use client";

import * as React from "react";
import { Sun, Moon, Laptop } from "lucide-react";
import { useTheme } from "@/context/theme-context";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [open, setOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`relative inline-block ${className || ""}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 hover:border-brand-300 dark:hover:border-brand-700 transition-all duration-150 flex items-center justify-center shadow-sm"
        aria-label="Toggle theme mode"
      >
        {resolvedTheme === "dark" ? (
          <Moon className="h-4 w-4 transition-transform rotate-0 scale-100" />
        ) : (
          <Sun className="h-4 w-4 transition-transform rotate-0 scale-100" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-36 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-dropdown z-50 animate-in fade-in-50 zoom-in-95 duration-150 text-xs font-semibold text-slate-700 dark:text-slate-300">
          <button
            type="button"
            onClick={() => {
              setTheme("light");
              setOpen(false);
            }}
            className={`w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors ${
              theme === "light" ? "text-brand-600 dark:text-brand-400 font-bold bg-slate-50/50 dark:bg-slate-800/40" : ""
            }`}
          >
            <Sun className="h-3.5 w-3.5" />
            <span>Light</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTheme("dark");
              setOpen(false);
            }}
            className={`w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors ${
              theme === "dark" ? "text-brand-600 dark:text-brand-400 font-bold bg-slate-50/50 dark:bg-slate-800/40" : ""
            }`}
          >
            <Moon className="h-3.5 w-3.5" />
            <span>Dark</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTheme("system");
              setOpen(false);
            }}
            className={`w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors ${
              theme === "system" ? "text-brand-600 dark:text-brand-400 font-bold bg-slate-50/50 dark:bg-slate-800/40" : ""
            }`}
          >
            <Laptop className="h-3.5 w-3.5" />
            <span>System</span>
          </button>
        </div>
      )}
    </div>
  );
}
