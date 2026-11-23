import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type DataTableColumn<T> = {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  className?: string;
  headerClassName?: string;
  mobileLabel?: ReactNode;
};

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  emptyState?: ReactNode;
  className?: string;
}

export function DataTable<T>({ columns, rows, rowKey, emptyState, className }: DataTableProps<T>) {
  if (rows.length === 0) {
    return <div className={className}>{emptyState ?? null}</div>;
  }

  return (
    <div className={cn("w-full", className)}>
      <div className="hidden overflow-hidden rounded-[12px] border border-border md:block">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-[#F7F8FA] dark:bg-[#121821]">
            <tr className="border-b border-border">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground",
                    col.headerClassName,
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={rowKey(row)} className="border-b border-border last:border-b-0 hover:bg-muted/30">
                {columns.map((col) => (
                  <td key={col.key} className={cn("px-4 py-3 align-middle text-foreground", col.className)}>
                    {col.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {rows.map((row) => (
          <div key={rowKey(row)} className="rounded-[12px] border border-border bg-card p-4">
            <dl className="space-y-3">
              {columns.map((col) => (
                <div key={col.key} className="flex items-start justify-between gap-3">
                  <dt className="shrink-0 text-xs font-medium uppercase tracking-[0.06em] text-muted-foreground">
                    {col.mobileLabel ?? col.header}
                  </dt>
                  <dd className={cn("min-w-0 text-right text-sm text-foreground", col.className)}>{col.cell(row)}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
    </div>
  );
}
