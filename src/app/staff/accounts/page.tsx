"use client";

import Link from "next/link";
import { useState } from "react";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { maskAccountNumber } from "@/lib/format";
import { formatBDT } from "@/lib/money";
import { useListAccountsQuery } from "@/store/api/accountsApi";

export default function StaffAccountsPage() {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const { data, isLoading } = useListAccountsQuery({ page, pageSize: 10, q: q || undefined });
  const accounts = data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Accounts</h1>
          <p className="mt-1 text-sm text-muted-foreground">View customer accounts (read-only).</p>
        </div>
        <Button render={<Link href="/staff/accounts/new" />} nativeButton={false}>
          New account
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Accounts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Search account number or owner"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
          />
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : accounts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No accounts found.</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accounts.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{maskAccountNumber(a.accountNumber)}</TableCell>
                      <TableCell>{a.owner?.name ?? "—"}</TableCell>
                      <TableCell>{a.type}</TableCell>
                      <TableCell>
                        <StatusBadge
                          variant={
                            a.status === "ACTIVE"
                              ? "success"
                              : a.status === "FROZEN"
                                ? "warning"
                                : "neutral"
                          }
                        >
                          {a.status}
                        </StatusBadge>
                      </TableCell>
                      <TableCell className="text-right">{formatBDT(a.balance)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          render={<Link href={`/staff/accounts/${a.id}`} />}
                          nativeButton={false}
                          size="sm"
                          variant="outline"
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Page {pagination?.page ?? page} of {pagination?.totalPages ?? 1}
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!pagination || page >= pagination.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
