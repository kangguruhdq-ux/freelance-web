"use client";

import * as React from "react";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface TypingUser {
  userId: string;
  name: string;
  avatarUrl?: string | null;
}

interface TypingIndicatorProps {
  users: TypingUser[];
  className?: string;
}

export function TypingIndicator({ users, className }: TypingIndicatorProps) {
  if (!users || users.length === 0) return null;

  const namesText =
    users.length === 1
      ? `${users[0].name} is typing`
      : users.length === 2
      ? `${users[0].name} & ${users[1].name} are typing`
      : "Several people are typing";

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex items-center gap-2.5 py-1 px-1 text-slate-500 dark:text-slate-400 animate-in fade-in slide-in-from-bottom-2 duration-200",
        className
      )}
    >
      <div className="flex -space-x-1.5 overflow-hidden">
        {users.slice(0, 2).map((u) => (
          <Avatar
            key={u.userId}
            src={u.avatarUrl}
            fallback={u.name}
            size="xs"
            className="ring-2 ring-white dark:ring-slate-900"
          />
        ))}
      </div>

      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
        <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
          {namesText}
        </span>

        {/* Next-level 3-dot smooth animated typing dots */}
        <span className="flex items-center gap-1 ml-0.5">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-500 animate-bounce [animation-delay:-0.32s]" />
          <span className="h-1.5 w-1.5 rounded-full bg-brand-500 animate-bounce [animation-delay:-0.16s]" />
          <span className="h-1.5 w-1.5 rounded-full bg-brand-500 animate-bounce" />
        </span>
      </div>
    </div>
  );
}
