"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  fallback: string;
  size?: "sm" | "md" | "lg" | "xl";
  status?: "online" | "offline" | "busy";
}

export function Avatar({
  src,
  alt = "User avatar",
  fallback,
  size = "md",
  status,
  className,
  ...props
}: AvatarProps) {
  const [imageError, setImageError] = React.useState(false);

  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-14 w-14 text-base",
    xl: "h-20 w-20 text-xl font-semibold",
  };

  const statusClasses = {
    online: "bg-emerald-500",
    offline: "bg-slate-400",
    busy: "bg-amber-500",
  };

  return (
    <div className={cn("relative inline-block select-none", className)} {...props}>
      <div
        className={cn(
          "relative overflow-hidden rounded-full bg-slate-100 flex items-center justify-center font-medium text-slate-700 ring-2 ring-white",
          sizeClasses[size]
        )}
      >
        {src && !imageError ? (
          <Image
            src={src}
            alt={alt}
            fill
            sizes="120px"
            className="object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <span>{fallback.slice(0, 2).toUpperCase()}</span>
        )}
      </div>
      {status && (
        <span
          className={cn(
            "absolute bottom-0 right-0 block rounded-full ring-2 ring-white",
            statusClasses[status],
            size === "sm" ? "h-2 w-2" : size === "xl" ? "h-4 w-4" : "h-3 w-3"
          )}
        />
      )}
    </div>
  );
}
