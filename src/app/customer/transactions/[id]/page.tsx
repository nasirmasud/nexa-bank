"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Download } from "lucide-react";
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
import { maskAccountNumber } from "@/lib/format";
import { formatBDT } from "@/lib/money";
import { useGetTransactionQuery } from "@/store/api/transactionsApi";

const statusVariant = (s: string): "success" | "danger" | "warning" | "neutral" =>
  s === "COMPLETED"
    ? "success"
    : s === "FAILED"
      ? "danger"
      : s === "REVERSED"
        ? "warning"
        : "neutral";

export default function CustomerTransactionDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { data, isLoading, error } = useGetTransactionQuery(id, { skip: !id });

  if (isLoading)
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full" />
      </div>
    );

  const err = error as { status?: number } | undefined;
  const tx = data?.data;
  if (err?.status === 404 || !tx) {
    return (
      <div className="space-y-4">
        <Button
          render={<Link href="/customer/transactions" />}
          nativeButton={false}
          variant="ghost"
          size="sm"
        >
          <ArrowLeft className="size-4" />
          Back to transactions
        </Button>
        <p className="text-sm text-muted-foreground">Transaction not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            render={<Link href="/customer/transactions" />}
            nativeButton={false}
            variant="ghost"
            size="sm"
          >
            <ArrowLeft className="size-4" />
            Back
          </Button>
          <div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              Transaction Receipt
            </h1>
            <p className="text-sm text-muted-foreground">{tx.reference}</p>
          </div>
        </div>
        <Button
          render={<a href={`/api/transactions/${id}/receipt`} />}
          nativeButton={false}
          variant="outline"
          size="sm"
        >
          <Download className="size-4" />
          Download PDF
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Reference</span>
              <span className="font-medium">{tx.reference}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type</span>
              <span>{tx.type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <StatusBadge variant={statusVariant(tx.status)}>{tx.status}</StatusBadge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount</span>
              <span className="font-medium">{formatBDT(tx.amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fee</span>
              <span>{formatBDT(tx.fee)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">From</span>
              <span>{tx.fromAccount ? maskAccountNumber(tx.fromAccount.accountNumber) : "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">To</span>
              <span>{tx.toAccount ? maskAccountNumber(tx.toAccount.accountNumber) : "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date</span>
              <span>{new Date(tx.createdAt).toLocaleString()}</span>
            </div>
            {tx.description && (
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Description</span>
                <span className="text-right">{tx.description}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ledger Entries</CardTitle>
        </CardHeader>
        <CardContent>
          {tx.ledger.length === 0 ? (
            <p className="text-sm text-muted-foreground">No ledger entries.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Direction</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Balance After</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tx.ledger.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>{e.direction}</TableCell>
                    <TableCell>{e.accountId.slice(0, 8)}…</TableCell>
                    <TableCell className="text-right">{formatBDT(e.amount)}</TableCell>
                    <TableCell className="text-right">{formatBDT(e.balanceAfter)}</TableCell>
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
