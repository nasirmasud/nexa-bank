import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

const statusBadgeVariants = cva(
  "inline-flex items-center rounded-[4px] border px-2 py-0.5 text-xs font-medium tracking-wide",
  {
    variants: {
      variant: {
        success:
          "border-[#86EFAC] bg-[#DCFCE7] text-[#15803D] dark:border-[#166534]/50 dark:bg-[#052e1a] dark:text-[#86EFAC]",
        warning:
          "border-[#FCD34D] bg-[#FEF3C7] text-[#B45309] dark:border-[#92400e]/50 dark:bg-[#2a1600] dark:text-[#FCD34D]",
        danger:
          "border-[#FCA5A5] bg-[#FEE2E2] text-[#B91C1C] dark:border-[#991b1b]/50 dark:bg-[#2a0a0a] dark:text-[#FCA5A5]",
        info:
          "border-[#93C5FD] bg-[#DBEAFE] text-[#1D4ED8] dark:border-[#1d4ed8]/50 dark:bg-[#0b1730] dark:text-[#93C5FD]",
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
