import * as React from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export interface RatingProps {
  score: number;
  maxScore?: number;
  showScore?: boolean;
  reviewCount?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Rating({
  score,
  maxScore = 5,
  showScore = true,
  reviewCount,
  size = "md",
  className,
}: RatingProps) {
  const sizeClasses = {
    sm: "h-3.5 w-3.5",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  return (
    <div className={cn("inline-flex items-center gap-1.5", className)}>
      <div className="flex items-center text-amber-400">
        {Array.from({ length: maxScore }).map((_, i) => {
          const filled = i < Math.floor(score);
          const half = !filled && i < score;

          return (
            <Star
              key={i}
              className={cn(
                sizeClasses[size],
                filled ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200",
                half && "fill-amber-400/50 text-amber-400"
              )}
            />
          );
        })}
      </div>
      {showScore && (
        <span className="text-sm font-semibold text-slate-800">
          {score.toFixed(1)}
        </span>
      )}
      {reviewCount !== undefined && (
        <span className="text-xs text-slate-500">
          ({reviewCount})
        </span>
      )}
    </div>
  );
}
