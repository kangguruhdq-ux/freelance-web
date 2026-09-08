"use client";

import * as React from "react";
import { CheckCircle2, AlertCircle, Info, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastType = "success" | "error" | "info" | "loading";

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, "id">) => string;
  removeToast: (id: string) => void;
  toast: {
    success: (message: string, title?: string) => string;
    error: (message: string, title?: string) => string;
    info: (message: string, title?: string) => string;
    loading: (message: string, title?: string) => string;
    dismiss: (id: string) => void;
  };
}

const ToastContext = React.createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = React.useCallback(
    (item: Omit<ToastItem, "id">) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const duration = item.duration ?? (item.type === "loading" ? 0 : 4000);

      const newToast: ToastItem = { ...item, id };
      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }

      return id;
    },
    [removeToast]
  );

  const toastHelpers = React.useMemo(
    () => ({
      success: (message: string, title?: string) =>
        addToast({ type: "success", message, title }),
      error: (message: string, title?: string) =>
        addToast({ type: "error", message, title }),
      info: (message: string, title?: string) =>
        addToast({ type: "info", message, title }),
      loading: (message: string, title?: string) =>
        addToast({ type: "loading", message, title, duration: 0 }),
      dismiss: (id: string) => removeToast(id),
    }),
    [addToast, removeToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, toast: toastHelpers }}>
      {children}

      {/* Floating Toast Notification Container */}
      <div
        aria-live="polite"
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none p-2 sm:p-0"
      >
        {toasts.map((t) => {
          const isSuccess = t.type === "success";
          const isError = t.type === "error";
          const isInfo = t.type === "info";
          const isLoading = t.type === "loading";

          return (
            <div
              key={t.id}
              role="alert"
              className={cn(
                "pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-xl backdrop-blur-md transition-all duration-300",
                "animate-in fade-in slide-in-from-bottom-4 duration-200",
                isSuccess &&
                  "bg-white dark:bg-slate-900 border-emerald-300 dark:border-emerald-800 text-slate-900 dark:text-white shadow-emerald-500/5",
                isError &&
                  "bg-white dark:bg-slate-900 border-rose-300 dark:border-rose-800 text-slate-900 dark:text-white shadow-rose-500/5",
                isInfo &&
                  "bg-white dark:bg-slate-900 border-indigo-300 dark:border-indigo-800 text-slate-900 dark:text-white shadow-indigo-500/5",
                isLoading &&
                  "bg-white dark:bg-slate-900 border-brand-300 dark:border-brand-800 text-slate-900 dark:text-white shadow-brand-500/5"
              )}
            >
              {/* Icon */}
              <div className="shrink-0 mt-0.5">
                {isSuccess && <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
                {isError && <AlertCircle className="h-5 w-5 text-rose-600 dark:text-rose-400" />}
                {isInfo && <Info className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />}
                {isLoading && <Loader2 className="h-5 w-5 text-brand-600 dark:text-brand-400 animate-spin" />}
              </div>

              {/* Text content */}
              <div className="flex-1 min-w-0 pr-1">
                {t.title && (
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight mb-0.5">
                    {t.title}
                  </h4>
                )}
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed break-words">
                  {t.message}
                </p>
              </div>

              {/* Close button */}
              <button
                type="button"
                onClick={() => removeToast(t.id)}
                className="shrink-0 p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                aria-label="Close notification"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
