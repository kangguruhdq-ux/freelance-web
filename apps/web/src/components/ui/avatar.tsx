"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
export type AvatarStatus =
  | "online"
  | "offline"
  | "busy"
  | "available"
  | "limited"
  | "unavailable"
  | "AVAILABLE"
  | "LIMITED"
  | "UNAVAILABLE";

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  alt?: string;
  fallback?: string;
  size?: AvatarSize;
  status?: AvatarStatus;
}

export function getInitials(name?: string): string {
  if (!name || typeof name !== "string") return "FH";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({
  src,
  alt = "User avatar",
  fallback = "FH",
  size = "md",
  status,
  className,
  ...props
}: AvatarProps) {
  const [imageError, setImageError] = React.useState(false);

  // Reset error state if src changes
  React.useEffect(() => {
    setImageError(false);
  }, [src]);

  const sizeClasses: Record<AvatarSize, string> = {
    xs: "h-6 w-6 text-[10px]",
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm font-bold",
    lg: "h-14 w-14 text-base font-bold",
    xl: "h-20 w-20 text-xl font-extrabold",
    "2xl": "h-28 w-28 text-3xl font-black",
  };

  const statusIndicatorSizes: Record<AvatarSize, string> = {
    xs: "h-1.5 w-1.5 ring-1",
    sm: "h-2.5 w-2.5 ring-2",
    md: "h-3 w-3 ring-2",
    lg: "h-3.5 w-3.5 ring-2",
    xl: "h-4 w-4 ring-2",
    "2xl": "h-5 w-5 ring-2",
  };

  const isAvailable = status === "online" || status === "available" || status === "AVAILABLE";
  const isLimited = status === "busy" || status === "limited" || status === "LIMITED";
  const isUnavailable = status === "offline" || status === "unavailable" || status === "UNAVAILABLE";

  const statusColorClass = isAvailable
    ? "bg-emerald-500"
    : isLimited
    ? "bg-amber-500"
    : isUnavailable
    ? "bg-slate-400 dark:bg-slate-500"
    : "";

  const initials = getInitials(fallback);

  return (
    <div
      className={cn("relative inline-block shrink-0 select-none", className)}
      role="img"
      aria-label={alt}
      {...props}
    >
      <div
        className={cn(
          "relative overflow-hidden rounded-full flex items-center justify-center transition-all duration-200",
          "bg-brand-50 dark:bg-slate-800 text-brand-700 dark:text-brand-300 font-bold tracking-tight",
          "ring-2 ring-white dark:ring-slate-900 shadow-xs",
          sizeClasses[size]
        )}
      >
        {src && !imageError ? (
          <Image
            src={src}
            alt={alt}
            fill
            unoptimized
            sizes="(max-width: 768px) 100px, 160px"
            className="object-cover rounded-full"
            onError={() => setImageError(true)}
          />
        ) : (
          <span className="leading-none">{initials}</span>
        )}
      </div>

      {status && statusColorClass && (
        <span
          className={cn(
            "absolute bottom-0 right-0 block rounded-full ring-white dark:ring-slate-900 transition-colors duration-200",
            statusColorClass,
            statusIndicatorSizes[size]
          )}
          title={`Status: ${status}`}
        />
      )}
    </div>
  );
}
