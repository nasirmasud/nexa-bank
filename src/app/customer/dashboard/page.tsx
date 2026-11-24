"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Landmark, Wallet } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
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
import { useListLoansQuery } from "@/store/api/loansApi";
import { useListTransactionsQuery } from "@/store/api/transactionsApi";

function toNumber(v: string | number | null | undefined) {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function monthKey(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string) {
  const [y, m] = key.split("-");
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleString("en-US", { month: "short" });
}

const PIE_COLORS = ["#0E7C66", "#1F3A5F", "#D97706", "#2FBF9F", "#B91C1C"];

export default function CustomerDashboard() {
  const accountsQuery = useListAccountsQuery({ page: 1, pageSize: 50 });
  const accounts = accountsQuery.data?.data ?? [];
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const effectiveSelectedId = selectedAccountId || accounts[0]?.id || "";
  const selectedAccount = accounts.find((a) => a.id === effectiveSelectedId) ?? accounts[0];

  const txQuery = useListTransactionsQuery(
    { page: 1, pageSize: 100, ...(selectedAccount?.id ? { accountId: selectedAccount.id } : {}) },
    { skip: accounts.length > 0 && !selectedAccount?.id },
  );
  const recentTxQuery = useListTransactionsQuery(
    { page: 1, pageSize: 10, ...(selectedAccount?.id ? { accountId: selectedAccount.id } : {}) },
    { skip: accounts.length > 0 && !selectedAccount?.id },
  );
  const loansQuery = useListLoansQuery({ page: 1, pageSize: 50 });

  const txs = txQuery.data?.data ?? [];
  const recentTxs = recentTxQuery.data?.data ?? [];
  const loans = loansQuery.data?.data ?? [];
  const activeLoans = loans.filter((l) => l.status === "ACTIVE");

  const totalBalance = accounts.reduce((sum, a) => sum + toNumber(a.balance), 0);
  const deposits = txs
    .filter((t) => t.type === "DEPOSIT")
    .reduce((s, t) => s + toNumber(t.amount), 0);
  const withdrawals = txs
    .filter((t) => t.type === "WITHDRAWAL")
    .reduce((s, t) => s + toNumber(t.amount), 0);

  const spendingByMonth = new Map<string, number>();
  const depositsByMonth = new Map<string, number>();
  const typeCounts = new Map<string, number>();

  for (const t of txs) {
    const key = monthKey(t.createdAt);
    if (t.type === "WITHDRAWAL" || t.type === "TRANSFER") {
      spendingByMonth.set(key, (spendingByMonth.get(key) ?? 0) + toNumber(t.amount) + toNumber(t.fee));
    }
    if (t.type === "DEPOSIT") {
      depositsByMonth.set(key, (depositsByMonth.get(key) ?? 0) + toNumber(t.amount));
    }
    typeCounts.set(t.type.replace(/_/g, " "), (typeCounts.get(t.type.replace(/_/g, " ")) ?? 0) + 1);
  }

  const spendingChart = useMemo(
    () =>
      Array.from(spendingByMonth.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-6)
        .map(([k, amount]) => ({ month: monthLabel(k), amount })),
    [txs],
  );
  const depositChart = useMemo(
    () =>
      Array.from(depositsByMonth.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-6)
        .map(([k, amount]) => ({ month: monthLabel(k), amount })),
    [txs],
  );
  const distributionChart = useMemo(
    () => Array.from(typeCounts.entries()).map(([name, value]) => ({ name, value })),
    [txs],
  );

  const loading = accountsQuery.isLoading || txQuery.isLoading || recentTxQuery.isLoading || loansQuery.isLoading;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your balances, recent activity, and quick actions.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {accounts.length > 1 && (
            <select
              aria-label="Select account"
              className="h-9 rounded-md border bg-background px-3 text-sm"
              value={selectedAccount?.id ?? ""}
              onChange={(e) => setSelectedAccountId(e.target.value)}
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.type} • {a.accountNumber}
                </option>
              ))}
            </select>
          )}
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
            <StatCard title="Total Balance" value={formatBDT(totalBalance)} icon={<Wallet className="size-4" />} />
            <StatCard title="Total Deposits" value={formatBDT(deposits)} icon={<ArrowDownLeft className="size-4" />} />
            <StatCard title="Total Withdrawals" value={formatBDT(withdrawals)} icon={<ArrowUpRight className="size-4" />} />
            <StatCard title="Active Loans" value={activeLoans.length} icon={<Landmark className="size-4" />} />
          </>
        )}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {recentTxQuery.isLoading ? (
              <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
            ) : recentTxs.length === 0 ? (
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
                  {recentTxs.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">{t.reference}</TableCell>
                      <TableCell>{t.type}</TableCell>
                      <TableCell>
                        <StatusBadge variant={t.status === "COMPLETED" ? "success" : t.status === "FAILED" ? "danger" : t.status === "REVERSED" ? "warning" : "neutral"}>
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
            <CardTitle>Account Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {accountsQuery.isLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : !selectedAccount ? (
              <p className="text-muted-foreground">No account found.</p>
            ) : (
              <>
                <div className="flex justify-between gap-4"><span className="text-muted-foreground">Account</span><span className="font-medium">{selectedAccount.accountNumber}</span></div>
                <div className="flex justify-between gap-4"><span className="text-muted-foreground">Type</span><span className="font-medium">{selectedAccount.type}</span></div>
                <div className="flex justify-between gap-4"><span className="text-muted-foreground">Status</span><span className="font-medium">{selectedAccount.status}</span></div>
                <div className="flex justify-between gap-4"><span className="text-muted-foreground">Balance</span><span className="font-medium">{formatBDT(selectedAccount.balance)}</span></div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Monthly Spending</CardTitle></CardHeader>
          <CardContent>
            {txQuery.isLoading ? <Skeleton className="h-56 w-full" /> : spendingChart.length === 0 ? <p className="text-sm text-muted-foreground">No spending data yet.</p> : (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={spendingChart}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} width={48} />
                    <Tooltip formatter={(value) => formatBDT(Number(value ?? 0))} />
                    <Bar dataKey="amount" fill="currentColor" className="fill-primary" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Monthly Deposit History</CardTitle></CardHeader>
          <CardContent>
            {txQuery.isLoading ? <Skeleton className="h-56 w-full" /> : depositChart.length === 0 ? <p className="text-sm text-muted-foreground">No deposit data yet.</p> : (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={depositChart}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} width={48} />
                    <Tooltip formatter={(value) => formatBDT(Number(value ?? 0))} />
                    <Bar dataKey="amount" fill="#0E7C66" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Transaction Distribution</CardTitle></CardHeader>
          <CardContent>
            {txQuery.isLoading ? <Skeleton className="h-56 w-full" /> : distributionChart.length === 0 ? <p className="text-sm text-muted-foreground">No transaction data yet.</p> : (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={distributionChart} dataKey="value" nameKey="name" outerRadius={80} innerRadius={45}>
                      {distributionChart.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Active Loans</CardTitle></CardHeader>
        <CardContent>
          {loansQuery.isLoading ? (
            <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : activeLoans.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active loans.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Loan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Approved</TableHead>
                  <TableHead className="text-right">EMI</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeLoans.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-medium">{l.loanNo}</TableCell>
                    <TableCell><StatusBadge variant="success">{l.status}</StatusBadge></TableCell>
                    <TableCell className="text-right">{formatBDT(l.approvedAmount ?? l.requestedAmount)}</TableCell>
                    <TableCell className="text-right">{l.emiAmount ? formatBDT(l.emiAmount) : "—"}</TableCell>
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
