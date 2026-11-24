"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
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

import { ChartCard } from "@/components/shared/chart-card";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatBDT } from "@/lib/money";
import { cn } from "@/lib/utils";
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

function formatAxisBDT(value: number | string) {
  const n = Number(value ?? 0);
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 10_000_000) return `${sign}৳${(abs / 10_000_000).toFixed(1)}Cr`;
  if (abs >= 100_000) return `${sign}৳${(abs / 100_000).toFixed(1)}L`;
  if (abs >= 1_000) return `${sign}৳${(abs / 1_000).toFixed(1)}K`;
  return `${sign}৳${abs.toFixed(0)}`;
}

function statusVariant(status: string): "success" | "warning" | "danger" | "info" | "neutral" {
  const s = status.toUpperCase();
  if (["COMPLETED", "APPROVED", "ACTIVE", "VERIFIED"].includes(s)) return "success";
  if (["PENDING", "UNDER_REVIEW", "REVERSED"].includes(s)) return "warning";
  if (["FAILED", "REJECTED", "BLOCKED", "FROZEN"].includes(s)) return "danger";
  return "neutral";
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
  const deposits = txs.filter((t) => t.type === "DEPOSIT").reduce((s, t) => s + toNumber(t.amount), 0);
  const withdrawals = txs.filter((t) => t.type === "WITHDRAWAL").reduce((s, t) => s + toNumber(t.amount), 0);

  const spendingChart = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of txs) {
      if (t.type === "WITHDRAWAL" || t.type === "TRANSFER") {
        const key = monthKey(t.createdAt);
        map.set(key, (map.get(key) ?? 0) + toNumber(t.amount) + toNumber(t.fee));
      }
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([k, amount]) => ({ month: monthLabel(k), amount }));
  }, [txs]);

  const depositChart = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of txs) {
      if (t.type === "DEPOSIT") {
        const key = monthKey(t.createdAt);
        map.set(key, (map.get(key) ?? 0) + toNumber(t.amount));
      }
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([k, amount]) => ({ month: monthLabel(k), amount }));
  }, [txs]);

  const distributionChart = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of txs) {
      const name = t.type.replace(/_/g, " ");
      map.set(name, (map.get(name) ?? 0) + 1);
    }
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [txs]);

  const loading = accountsQuery.isLoading || txQuery.isLoading || recentTxQuery.isLoading || loansQuery.isLoading;

  if (!accountsQuery.isLoading && accounts.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Dashboard"
          description="Your balances, recent activity, loans, and account insights."
          breadcrumb={<span>Workspace / Dashboard</span>}
        />
        <EmptyState
          title="No account yet"
          description="Your bank staff will open an account for you."
          className="min-h-[240px]"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Your balances, recent activity, loans, and account insights."
        breadcrumb={<span>Workspace / Dashboard</span>}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {accounts.length > 1 && (
              <select
                aria-label="Select account"
                className="h-9 rounded-[8px] border border-input bg-background px-3 text-sm text-foreground"
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
            <Link href="/customer/accounts" className={cn(buttonVariants({ variant: "outline" }), "rounded-[8px]")}>
              Accounts
            </Link>
            <Link href="/customer/transfer" className={cn(buttonVariants(), "rounded-[8px] bg-[#0E7C66] text-white hover:bg-[#0E7C66]/90")}>
              Transfer
            </Link>
          </div>
        }
      />

      <section aria-label="Key performance indicators" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[132px] w-full rounded-[12px]" />)
        ) : (
          <>
            <StatCard title="Total Balance" value={formatBDT(totalBalance)} icon={<Wallet className="size-4" aria-hidden="true" />} />
            <StatCard title="Total Deposits" value={formatBDT(deposits)} icon={<ArrowDownLeft className="size-4" aria-hidden="true" />} description="Selected account history" />
            <StatCard title="Total Withdrawals" value={formatBDT(withdrawals)} icon={<ArrowUpRight className="size-4" aria-hidden="true" />} description="Selected account history" />
            <StatCard title="Active Loans" value={activeLoans.length} icon={<Landmark className="size-4" aria-hidden="true" />} />
          </>
        )}
      </section>

      <section aria-label="Recent activity and account" className="grid gap-4 xl:grid-cols-3">
        <ChartCard title="Recent Transactions" description="Latest transactions for the selected account." className="xl:col-span-2">
          {recentTxQuery.isLoading ? (
            <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : recentTxs.length === 0 ? (
            <EmptyState title="No transactions yet" description="Your recent transactions will appear here." className="min-h-[180px]" />
          ) : (
            <DataTable
              columns={[
                { key: "reference", header: "Reference", cell: (t) => <span className="font-mono text-xs text-foreground">{t.reference}</span> },
                { key: "type", header: "Type", cell: (t) => <span className="text-xs text-muted-foreground">{t.type.replace(/_/g, " ")}</span> },
                { key: "status", header: "Status", cell: (t) => <StatusBadge variant={statusVariant(t.status)}>{t.status}</StatusBadge> },
                {
                  key: "amount",
                  header: "Amount",
                  headerClassName: "text-right",
                  className: "text-right",
                  cell: (t) => <span className="font-mono text-xs tabular-nums text-foreground">{formatBDT(t.amount)}</span>,
                },
              ]}
              rows={recentTxs}
              rowKey={(t) => t.id}
            />
          )}
        </ChartCard>

        <ChartCard title="Account Info" description="Selected account details.">
          {accountsQuery.isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : !selectedAccount ? (
            <EmptyState title="No account found" description="Your account information will appear here." className="min-h-[180px]" />
          ) : (
            <div className="space-y-3 text-sm">
              <InfoRow label="Account" value={selectedAccount.accountNumber} />
              <InfoRow label="Type" value={selectedAccount.type} />
              <InfoRow label="Status" value={<StatusBadge variant={statusVariant(selectedAccount.status)}>{selectedAccount.status}</StatusBadge>} />
              <InfoRow label="Balance" value={formatBDT(selectedAccount.balance)} />
            </div>
          )}
        </ChartCard>
      </section>

      <section aria-label="Charts" className="grid gap-4 xl:grid-cols-3">
        <ChartCard title="Monthly Spending" description="Withdrawals and transfers by month (selected account).">
          {txQuery.isLoading ? <Skeleton className="h-64 w-full" /> : spendingChart.length === 0 ? (
            <EmptyState title="No spending data yet" description="Spending activity will appear here." className="min-h-[220px]" />
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={spendingChart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                  <YAxis tickFormatter={formatAxisBDT} tick={{ fontSize: 12 }} width={72} tickLine={false} axisLine={false} />
                  <Tooltip formatter={(value) => formatBDT(Number(value ?? 0))} />
                  <Bar dataKey="amount" fill="#0E7C66" radius={[6, 6, 0, 0]} maxBarSize={44} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>

        <ChartCard title="Monthly Deposit History" description="Deposits by month (selected account).">
          {txQuery.isLoading ? <Skeleton className="h-64 w-full" /> : depositChart.length === 0 ? (
            <EmptyState title="No deposit data yet" description="Deposit history will appear here." className="min-h-[220px]" />
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={depositChart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                  <YAxis tickFormatter={formatAxisBDT} tick={{ fontSize: 12 }} width={72} tickLine={false} axisLine={false} />
                  <Tooltip formatter={(value) => formatBDT(Number(value ?? 0))} />
                  <Bar dataKey="amount" fill="#1F3A5F" radius={[6, 6, 0, 0]} maxBarSize={44} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>

        <ChartCard title="Transaction Distribution" description="Transaction types for selected account.">
          {txQuery.isLoading ? <Skeleton className="h-64 w-full" /> : distributionChart.length === 0 ? (
            <EmptyState title="No transaction data yet" description="Transaction distribution will appear here." className="min-h-[220px]" />
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={distributionChart} dataKey="value" nameKey="name" outerRadius={84} innerRadius={48} paddingAngle={2}>
                    {distributionChart.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>
      </section>

      <ChartCard title="Active Loans" description="Loans currently active on your account.">
        {loansQuery.isLoading ? (
          <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
        ) : activeLoans.length === 0 ? (
          <EmptyState title="No active loans" description="Your active loans will appear here." className="min-h-[180px]" />
        ) : (
          <DataTable
            columns={[
              { key: "loan", header: "Loan", cell: (l) => <span className="font-medium text-foreground">{l.loanNo}</span> },
              { key: "status", header: "Status", cell: (l) => <StatusBadge variant="success">{l.status}</StatusBadge> },
              {
                key: "approved",
                header: "Approved",
                headerClassName: "text-right",
                className: "text-right",
                cell: (l) => <span className="font-mono text-xs tabular-nums">{formatBDT(l.approvedAmount ?? l.requestedAmount)}</span>,
              },
              {
                key: "emi",
                header: "EMI",
                headerClassName: "text-right",
                className: "text-right",
                cell: (l) => <span className="font-mono text-xs tabular-nums">{l.emiAmount ? formatBDT(l.emiAmount) : "—"}</span>,
              },
            ]}
            rows={activeLoans}
            rowKey={(l) => l.id}
          />
        )}
      </ChartCard>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium text-foreground">{value}</span>
    </div>
  );
}
