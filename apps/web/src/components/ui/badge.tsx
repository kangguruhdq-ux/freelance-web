import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border border-transparent bg-brand-50 text-brand-700 hover:bg-brand-100 dark:bg-brand-950/60 dark:text-brand-300 dark:border-brand-800/50",
        secondary:
          "border border-transparent bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
        outline:
          "border border-slate-200 text-slate-700 bg-white dark:border-slate-800 dark:text-slate-300 dark:bg-slate-900",
        success:
          "border border-emerald-200 bg-emerald-50 text-emerald-700 font-medium dark:bg-emerald-950/50 dark:border-emerald-800/60 dark:text-emerald-300",
        warning:
          "border border-amber-200 bg-amber-50 text-amber-800 font-medium dark:bg-amber-950/50 dark:border-amber-800/60 dark:text-amber-300",
        accent:
          "border border-indigo-200 bg-indigo-50 text-indigo-700 font-medium dark:bg-indigo-950/50 dark:border-indigo-800/60 dark:text-indigo-300",
        destructive:
          "border border-rose-200 bg-rose-50 text-rose-700 font-medium dark:bg-rose-950/50 dark:border-rose-800/60 dark:text-rose-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
