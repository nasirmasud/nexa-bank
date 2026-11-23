import type { ReactNode } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: ReactNode;
  icon?: ReactNode;
  description?: ReactNode;
  delta?: ReactNode;
  deltaTone?: "positive" | "negative" | "neutral";
  valueTooltip?: string;
  className?: string;
  valueClassName?: string;
  contentClassName?: string;
  featured?: boolean;
  background?: ReactNode;
}

export function StatCard({
  title,
  value,
  icon,
  description,
  delta,
  deltaTone = "neutral",
  valueTooltip,
  className,
  valueClassName,
  contentClassName,
  featured = false,
  background,
}: StatCardProps) {
  const deltaClass =
    deltaTone === "positive"
      ? "text-[#15803D] dark:text-[#4ADE80]"
      : deltaTone === "negative"
        ? "text-[#B91C1C] dark:text-[#FCA5A5]"
        : "text-muted-foreground";

  return (
    <Card
      className={cn(
        "relative h-full gap-0 overflow-hidden rounded-[12px] border border-border bg-card py-0 shadow-none",
        featured && "border-white/10 bg-[#0B1F1A] text-white",
        className,
      )}
    >
      {background ? <div className="absolute inset-0" aria-hidden="true">{background}</div> : null}
      <CardContent className={cn("relative flex h-full flex-col p-5", contentClassName)}>
        <div className="flex items-start justify-between gap-3">
          <p className={cn("text-sm font-medium", featured ? "text-white/75" : "text-muted-foreground")}>{title}</p>
          {icon ? (
            <div
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-[10px] border",
                featured
                  ? "border-white/15 bg-white/10 text-white"
                  : "border-[#E4E7EC] bg-[#F7F8FA] text-[#0E7C66] dark:border-[#243244] dark:bg-[#121821]",
              )}
            >
              {icon}
            </div>
          ) : null}
        </div>
        <div
          className={cn(
            "mt-4 font-heading text-2xl font-semibold leading-tight tracking-tight tabular-nums [font-variant-numeric:tabular-nums]",
            featured ? "text-white" : "text-foreground",
            valueClassName,
          )}
          title={valueTooltip}
        >
          {value}
        </div>
        {(description || delta) ? (
          <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
            {delta ? <span className={cn("font-medium", featured ? "text-emerald-300" : deltaClass)}>{delta}</span> : null}
            {description ? (
              <span className={cn(featured ? "text-white/65" : "text-muted-foreground")}>{description}</span>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
