import type { ReactNode } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: ReactNode;
  icon?: ReactNode;
  description?: ReactNode;
  className?: string;
  valueClassName?: string;
}

export function StatCard({
  title,
  value,
  icon,
  description,
  className,
  valueClassName,
}: StatCardProps) {
  return (
    <Card className={cn("gap-0 py-4 shadow-sm", className)}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 px-4 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {icon ? <div className="text-muted-foreground">{icon}</div> : null}
      </CardHeader>
      <CardContent className="px-4">
        <div
          className={cn(
            "font-heading text-2xl font-semibold tracking-tight tabular-nums",
            valueClassName,
          )}
        >
          {value}
        </div>
        {description ? (
          <div className="mt-2 text-xs text-muted-foreground">{description}</div>
        ) : null}
      </CardContent>
    </Card>
  );
}
