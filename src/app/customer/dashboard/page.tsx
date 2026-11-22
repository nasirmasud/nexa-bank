"use client";

import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight, Landmark, Wallet } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
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
import { useListAccountsQuery } from "@/store/api/accountsApi";
import { useListTransactionsQuery } from "@/store/api/transactionsApi";

function toNumber(v: string | number | null | undefined) {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function monthLabel(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-US", { month: "short" });
}

export default function CustomerDashboard() {
  const accountsQuery = useListAccountsQuery({ page: 1, pageSize: 50 });
  const txQuery = useListTransactionsQuery({ page: 1, pageSize: 10 });

  const accounts = accountsQuery.data?.data ?? [];
  const txs = txQuery.data?.data ?? [];

  const totalBalance = accounts.reduce((sum, a) => sum + toNumber(a.balance), 0);
  const activeAccounts = accounts.filter((a) => a.status === "ACTIVE").length;
  const deposits = txs
    .filter((t) => t.type === "DEPOSIT")
    .reduce((s, t) => s + toNumber(t.amount), 0);
  const withdrawals = txs
    .filter((t) => t.type === "WITHDRAWAL" || t.type === "TRANSFER")
    .reduce((s, t) => s + toNumber(t.amount) + toNumber(t.fee), 0);

  const spendingByMonth = new Map<string, number>();
  for (const t of txs) {
    if (t.type === "WITHDRAWAL" || t.type === "TRANSFER") {
      const key = monthLabel(t.createdAt);
      spendingByMonth.set(
        key,
        (spendingByMonth.get(key) ?? 0) + toNumber(t.amount) + toNumber(t.fee),
      );
    }
  }
  const chartData = Array.from(spendingByMonth.entries())
    .map(([month, amount]) => ({ month, amount }))
    .reverse();

  const loading = accountsQuery.isLoading || txQuery.isLoading;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your balances, recent activity, and quick actions.
          </p>
        </div>
        <div className="flex gap-2">
          <Button render={<Link href="/customer/accounts" />} nativeButton={false} variant="outline">
            Accounts
          </Button>
          <Button render={<Link href="/customer/transfer" />} nativeButton={false}>Transfer</Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-lg" />)
        ) : (
          <>
            <StatCard
              title="Total Balance"
              value={formatBDT(totalBalance)}
              icon={<Wallet className="size-4" />}
            />
            <StatCard
              title="Active Accounts"
              value={activeAccounts}
              icon={<Landmark className="size-4" />}
            />
            <StatCard
              title="Recent Deposits"
              value={formatBDT(deposits)}
              icon={<ArrowDownLeft className="size-4" />}
            />
            <StatCard
              title="Recent Outflow"
              value={formatBDT(withdrawals)}
              icon={<ArrowUpRight className="size-4" />}
            />
          </>
        )}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : txs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No transactions yet.</p>
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

        <Card>
          <CardHeader>
            <CardTitle>Monthly Spending</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-56 w-full" />
            ) : chartData.length === 0 ? (
              <p className="text-sm text-muted-foreground">No spending data yet.</p>
            ) : (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} width={48} />
                    <Tooltip formatter={(value) => formatBDT(Number(value ?? 0))} />
                    <Bar
                      dataKey="amount"
                      fill="currentColor"
                      className="fill-primary"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
