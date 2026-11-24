"use client";

import { useState } from "react";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatBDT } from "@/lib/money";
import { useListSuspiciousFlagsQuery } from "@/store/api/suspiciousFlagsApi";

const statusVariant = (s: string): "success" | "danger" | "warning" | "neutral" =>
  s === "DISMISSED" ? "success" : s === "ESCALATED" ? "danger" : "warning";

export default function StaffSuspiciousPage() {
  const [status, setStatus] = useState("OPEN");
  const { data, isLoading } = useListSuspiciousFlagsQuery({
    page: 1,
    pageSize: 20,
    ...(status ? { status } : {}),
  });
  const items = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Suspicious Queue</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review flagged transactions. Flag resolution is handled by admins.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 space-y-0 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Flags</CardTitle>
          <select
            aria-label="Filter by status"
            className="h-9 w-full rounded-md border bg-background px-3 text-sm sm:w-auto"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All</option>
            <option value="OPEN">Open</option>
            <option value="DISMISSED">Dismissed</option>
            <option value="ESCALATED">Escalated</option>
          </select>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No flags found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell className="font-medium">{f.transaction.reference}</TableCell>
                    <TableCell className="max-w-[240px] truncate">{f.reason}</TableCell>
                    <TableCell>
                      <StatusBadge variant={statusVariant(f.status)}>{f.status}</StatusBadge>
                    </TableCell>
                    <TableCell className="text-right">{formatBDT(f.transaction.amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
