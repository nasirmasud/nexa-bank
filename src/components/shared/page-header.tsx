"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type DateRange = "3M" | "6M" | "12M";

const ranges: DateRange[] = ["3M", "6M", "12M"];

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumb?: ReactNode;
  actions?: ReactNode;
  range?: DateRange;
  onRangeChange?: (range: DateRange) => void;
  showRange?: boolean;
  className?: string;
}

export function PageHeader({
  title,
  description,
  breadcrumb,
  actions,
  range,
  onRangeChange,
  showRange = false,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between", className)}>
      <div className="min-w-0 space-y-2">
        {breadcrumb ? <div className="text-xs text-muted-foreground">{breadcrumb}</div> : null}
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-[2rem]">{title}</h1>
          {description ? <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p> : null}
        </div>
      </div>
      {(showRange || actions) ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {showRange && range && onRangeChange ? (
            <div className="inline-flex w-fit rounded-[8px] border border-border bg-card p-1" role="radiogroup" aria-label="Date range">
              {ranges.map((r) => {
                const active = r === range;
                return (
                  <button
                    key={r}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => onRangeChange(r)}
                    className={cn(
                      "rounded-[6px] px-3 py-1.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7C66]",
                      active
                        ? "bg-[#0E7C66] text-white shadow-sm"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    {r}
                  </button>
                );
              })}
            </div>
          ) : null}
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </div>
      ) : null}
    </div>
  );
}
