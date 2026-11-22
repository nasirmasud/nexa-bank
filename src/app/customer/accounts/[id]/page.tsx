"use client";

import Link from "next/link";
import { useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Download } from "lucide-react";
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
import { useGetAccountQuery } from "@/store/api/accountsApi";
import { useListTransactionsQuery } from "@/store/api/transactionsApi";

export default function CustomerAccountDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const accountQuery = useGetAccountQuery(id, { skip: !id });
  const txQuery = useListTransactionsQuery({ accountId: id, page: 1, pageSize: 10 }, { skip: !id });
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  if (accountQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const error = accountQuery.error as { status?: number } | undefined;
  if (error?.status === 404 || !accountQuery.data?.data) {
    return (
      <div className="space-y-4">
        <Button
          render={<Link href="/customer/accounts" />}
          nativeButton={false}
          variant="ghost"
          size="sm"
        >
          <ArrowLeft className="size-4" />
          Back to accounts
        </Button>
        <p className="text-sm text-muted-foreground">Account not found.</p>
      </div>
    );
  }

  const a = accountQuery.data.data;
  const txs = txQuery.data?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button
          render={<Link href="/customer/accounts" />}
          nativeButton={false}
          variant="ghost"
          size="sm"
        >
          <ArrowLeft className="size-4" />
          Back
        </Button>
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            {a.nickname || "Account details"}
          </h1>
          <p className="text-sm text-muted-foreground">{maskAccountNumber(a.accountNumber)}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Account Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Account number</span>
              <span>{maskAccountNumber(a.accountNumber)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type</span>
              <span>{a.type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <StatusBadge
                variant={
                  a.status === "ACTIVE" ? "success" : a.status === "FROZEN" ? "warning" : "neutral"
                }
              >
                {a.status}
              </StatusBadge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Balance</span>
              <span className="font-medium">{formatBDT(a.balance)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Daily transfer limit</span>
              <span>{a.dailyTransferLimit ? formatBDT(a.dailyTransferLimit) : "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Per-tx limit</span>
              <span>{a.perTxLimit ? formatBDT(a.perTxLimit) : "—"}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Statement Export</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <Button
              render={
                <a
                  href={`/api/accounts/${id}/statement?format=csv${from ? `&from=${from}` : ""}${to ? `&to=${to}` : ""}`}
                />
              }
              nativeButton={false}
              variant="outline"
              size="sm"
            >
              <Download className="size-4" /> CSV
            </Button>
            <Button
              render={
                <a
                  href={`/api/accounts/${id}/statement?format=pdf${from ? `&from=${from}` : ""}${to ? `&to=${to}` : ""}`}
                />
              }
              nativeButton={false}
              variant="outline"
              size="sm"
            >
              <Download className="size-4" /> PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {txQuery.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : txs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No transactions for this account.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {txs.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.reference}</TableCell>
                    <TableCell>{t.type}</TableCell>
                    <TableCell>
                      <StatusBadge
                        variant={
                          t.status === "COMPLETED"
                            ? "success"
                            : t.status === "FAILED"
                              ? "danger"
                              : t.status === "REVERSED"
                                ? "warning"
                                : "neutral"
                        }
                      >
                        {t.status}
                      </StatusBadge>
                    </TableCell>
                    <TableCell className="text-right">{formatBDT(t.amount)}</TableCell>
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
