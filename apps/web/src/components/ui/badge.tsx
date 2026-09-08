import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border border-transparent bg-brand-50 text-brand-700 hover:bg-brand-100",
        secondary:
          "border border-transparent bg-slate-100 text-slate-700 hover:bg-slate-200",
        outline:
          "border border-slate-200 text-slate-700 bg-white",
        success:
          "border border-emerald-200 bg-emerald-50 text-emerald-700 font-medium",
        warning:
          "border border-amber-200 bg-amber-50 text-amber-800 font-medium",
        accent:
          "border border-indigo-200 bg-indigo-50 text-indigo-700 font-medium",
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
