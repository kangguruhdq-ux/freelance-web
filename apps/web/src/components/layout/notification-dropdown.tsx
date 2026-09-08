"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  CheckCheck,
  MessageSquare,
  FileText,
  CheckCircle2,
  XCircle,
  Briefcase,
  UploadCloud,
  DollarSign,
  Star,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { NotificationItem } from "@freelancehub/types";
import { cn } from "@/lib/utils";

function getNotificationIcon(type: string) {
  switch (type) {
    case "PROPOSAL_RECEIVED":
      return <FileText className="h-4 w-4 text-brand-500" />;
    case "PROPOSAL_ACCEPTED":
      return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
    case "PROPOSAL_REJECTED":
      return <XCircle className="h-4 w-4 text-rose-500" />;
    case "NEW_MESSAGE":
      return <MessageSquare className="h-4 w-4 text-indigo-500" />;
    case "CONTRACT_CREATED":
      return <Briefcase className="h-4 w-4 text-brand-600" />;
    case "MILESTONE_SUBMITTED":
      return <UploadCloud className="h-4 w-4 text-amber-500" />;
    case "MILESTONE_APPROVED":
    case "PAYMENT_RELEASED":
      return <DollarSign className="h-4 w-4 text-emerald-600" />;
    case "REVIEW_RECEIVED":
      return <Star className="h-4 w-4 text-amber-400 fill-amber-400" />;
    case "DISPUTE_OPENED":
      return <AlertTriangle className="h-4 w-4 text-rose-500" />;
    default:
      return <Sparkles className="h-4 w-4 text-brand-500" />;
  }
}

function formatRelativeTime(dateString: string): string {
  try {
    const diffMs = Date.now() - new Date(dateString).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return "Just now";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(dateString).toLocaleDateString();
  } catch {
    return "";
  }
}

export function NotificationDropdown() {
  const router = useRouter();
  const [isOpen, setIsOpen] = React.useState(false);
  const [notifications, setNotifications] = React.useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const dropdownRef = React.useRef<HTMLDivElement | null>(null);

  const fetchNotifications = React.useCallback(async () => {
    try {
      const res = await apiFetch("/notifications");
      if (res.success && Array.isArray(res.data)) {
        setNotifications(res.data);
        setUnreadCount(Number(res.unreadCount) || 0);
      }
    } catch {
      // Ignore background notification fetch errors
    }
  }, []);

  // Initial load and periodic polling (15s)
  React.useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Click outside to close
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleMarkAllRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await apiFetch("/notifications/read-all", { method: "POST" });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const handleItemClick = async (item: NotificationItem) => {
    // Optimistically mark as read
    if (!item.isRead) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      apiFetch(`/notifications/${item.id}/read`, { method: "PATCH" }).catch(() => {});
    }

    setIsOpen(false);

    // Direct targeted navigation
    if (item.linkUrl) {
      router.push(item.linkUrl);
    }
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-label={`Notifications, ${unreadCount} unread`}
        className={cn(
          "relative p-2 rounded-xl transition-all duration-200 focus:outline-hidden",
          "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white",
          "hover:bg-slate-100 dark:hover:bg-slate-800",
          isOpen && "bg-slate-100 dark:bg-slate-800 text-brand-600 dark:text-brand-400"
        )}
      >
        <Bell className="h-5 w-5" />

        {/* Unread Counter Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-extrabold text-white shadow-xs">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-60" />
            <span className="relative">{unreadCount > 99 ? "99+" : unreadCount}</span>
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          role="region"
          aria-label="Notification list"
          className={cn(
            "absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border shadow-2xl z-50 overflow-hidden",
            "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800",
            "animate-in fade-in zoom-in-95 duration-150"
          )}
        >
          {/* Header */}
          <div className="p-3.5 px-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-950/40">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-xs text-slate-500 hover:text-brand-600 dark:hover:text-brand-400 font-semibold inline-flex items-center gap-1 transition-colors"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* List of Notifications */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
            {notifications.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <Bell className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto" />
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">All caught up!</p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  You have no notifications right now.
                </p>
              </div>
            ) : (
              notifications.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={cn(
                    "w-full text-left p-3.5 px-4 flex items-start gap-3 transition-colors duration-150",
                    "hover:bg-slate-50 dark:hover:bg-slate-800/50",
                    !item.isRead && "bg-brand-50/30 dark:bg-brand-950/15"
                  )}
                >
                  {/* Event Icon Badge */}
                  <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0 mt-0.5">
                    {getNotificationIcon(item.type)}
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center justify-between gap-1">
                      <p
                        className={cn(
                          "text-xs font-semibold truncate",
                          item.isRead
                            ? "text-slate-700 dark:text-slate-300"
                            : "text-slate-900 dark:text-white font-bold"
                        )}
                      >
                        {item.title}
                      </p>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0">
                        {formatRelativeTime(item.createdAt)}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {item.message}
                    </p>
                  </div>

                  {/* Unread indicator dot */}
                  {!item.isRead && (
                    <span className="h-2 w-2 rounded-full bg-brand-500 shrink-0 mt-2" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
