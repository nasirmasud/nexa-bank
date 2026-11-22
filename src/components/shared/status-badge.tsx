import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

const statusBadgeVariants = cva(
  "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold tracking-wide",
  {
    variants: {
      variant: {
        success: "border-[#86EFAC] bg-[#DCFCE7] text-[#15803D]",
        warning: "border-[#FCD34D] bg-[#FEF3C7] text-[#B45309]",
        danger: "border-[#FCA5A5] bg-[#FEE2E2] text-[#B91C1C]",
        info: "border-[#93C5FD] bg-[#DBEAFE] text-[#1D4ED8]",
        neutral: "border-border bg-muted text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  },
);

export interface StatusBadgeProps
  extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof statusBadgeVariants> {}

export function StatusBadge({ className, variant, ...props }: StatusBadgeProps) {
  return <span className={cn(statusBadgeVariants({ variant }), className)} {...props} />;
}
