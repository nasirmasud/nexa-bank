"use client";

import Link from "next/link";
import { ClipboardList, Clock3 } from "lucide-react";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
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
import { useListRequestsQuery } from "@/store/api/requestsApi";

export default function StaffDashboard() {
  const pending = useListRequestsQuery({ page: 1, pageSize: 1, status: "PENDING" });
  const recent = useListRequestsQuery({ page: 1, pageSize: 5 });
  const pendingCount = pending.data?.pagination.total ?? 0;
  const recentItems = recent.data?.data ?? [];
  const loading = pending.isLoading || recent.isLoading;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Staff Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review pending requests and recent activity.
          </p>
        </div>
        <Button render={<Link href="/staff/requests" />} nativeButton={false}>
          View requests
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-lg" />)
        ) : (
          <>
            <StatCard
              title="Pending Requests"
              value={pendingCount}
              icon={<Clock3 className="size-4" />}
            />
            <StatCard
              title="Recent Requests"
              value={recent.data?.pagination.total ?? 0}
              icon={<ClipboardList className="size-4" />}
            />
          </>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : recentItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">No requests found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Requester</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentItems.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.requester?.name ?? r.requesterId.slice(0, 8)}</TableCell>
                    <TableCell>{r.type}</TableCell>
                    <TableCell>{formatBDT(r.amount)}</TableCell>
                    <TableCell>
                      <StatusBadge
                        variant={
                          r.status === "APPROVED"
                            ? "success"
                            : r.status === "REJECTED"
                              ? "danger"
                              : r.status === "PENDING"
                                ? "warning"
                                : "neutral"
                        }
                      >
                        {r.status}
                      </StatusBadge>
                    </TableCell>
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
