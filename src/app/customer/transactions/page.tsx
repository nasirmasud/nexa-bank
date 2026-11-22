"use client";

import Link from "next/link";
import { useState } from "react";
import { Eye } from "lucide-react";
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
import { formatBDT } from "@/lib/money";
import { useListTransactionsQuery } from "@/store/api/transactionsApi";

const statusVariant = (s: string): "success" | "danger" | "warning" | "neutral" =>
  s === "COMPLETED"
    ? "success"
    : s === "FAILED"
      ? "danger"
      : s === "REVERSED"
        ? "warning"
        : "neutral";

export default function CustomerTransactionsPage() {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const { data, isLoading } = useListTransactionsQuery({
    page,
    pageSize: 10,
    q: q || undefined,
    type: type || undefined,
    status: status || undefined,
  });
  const txs = data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Transactions</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          View and filter your transaction history.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-3">
            <Input
              placeholder="Search reference"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
            />
            <select
              aria-label="Filter by type"
              className="h-9 w-full rounded-md border bg-background px-3 text-sm"
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All types</option>
              <option value="DEPOSIT">Deposit</option>
              <option value="WITHDRAWAL">Withdrawal</option>
              <option value="TRANSFER">Transfer</option>
            </select>
            <select
              aria-label="Filter by status"
              className="h-9 w-full rounded-md border bg-background px-3 text-sm"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All statuses</option>
              <option value="COMPLETED">Completed</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
              <option value="REVERSED">Reversed</option>
            </select>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : txs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No transactions found.</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Reference</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="whitespace-nowrap">Date</TableHead>
                    <TableHead className="text-right whitespace-nowrap">Amount</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {txs.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium whitespace-nowrap">{t.reference}</TableCell>
                      <TableCell className="whitespace-nowrap">{t.type}</TableCell>
                      <TableCell>
                        <StatusBadge variant={statusVariant(t.status)}>{t.status}</StatusBadge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {new Date(t.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        {formatBDT(t.amount)}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <Button
                          render={<Link href={`/customer/transactions/${t.id}`} />}
                          nativeButton={false}
                          variant="ghost"
                          size="sm"
                        >
                          <Eye className="size-4" />
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
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
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
