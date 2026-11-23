import type { ReactNode } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ChartCardProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

export function ChartCard({
  title,
  description,
  actions,
  children,
  className,
  contentClassName,
}: ChartCardProps) {
  return (
    <Card className={cn("h-full gap-0 rounded-[12px] border border-border bg-card py-0 shadow-none", className)}>
      <CardHeader className="flex flex-row items-start justify-between gap-4 px-5 py-5 pb-3">
        <div className="min-w-0 space-y-1">
          <CardTitle className="font-heading text-base font-semibold tracking-tight text-foreground">{title}</CardTitle>
          {description ? <CardDescription className="text-sm leading-5 text-muted-foreground">{description}</CardDescription> : null}
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </CardHeader>
      <CardContent className={cn("px-5 pb-5 pt-0", contentClassName)}>{children}</CardContent>
    </Card>
  );
}
