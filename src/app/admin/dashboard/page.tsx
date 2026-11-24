"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Landmark,
  ReceiptText,
  ShieldAlert,
  Users,
  Wallet,
} from "lucide-react";

import { ChartCard } from "@/components/shared/chart-card";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader, type DateRange } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { GlassFold } from "@/components/ui/glass-fold";
import { formatBDT } from "@/lib/money";
import { cn } from "@/lib/utils";
import { useGetAdminAnalyticsQuery } from "@/store/api/analyticsApi";
import { useListLoansQuery } from "@/store/api/loansApi";
import { useListSuspiciousFlagsQuery } from "@/store/api/suspiciousFlagsApi";
import { useListTransactionsQuery } from "@/store/api/transactionsApi";

const BRAND = {
  primary: "#0E7C66",
  secondary: "#1F3A5F",
  amber: "#B45309",
  rose: "#B91C1C",
  teal: "#2FBF9F",
  slate: "#64748B",
};
const PIE_COLORS = [BRAND.primary, BRAND.secondary, "#D97706", BRAND.teal, BRAND.rose, BRAND.slate];

function formatCompactBDT(value: number) {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 10_000_000) return `${sign}৳${(abs / 10_000_000).toFixed(abs % 10_000_000 === 0 ? 0 : 1)}Cr`;
  if (abs >= 100_000) return `${sign}৳${(abs / 100_000).toFixed(abs % 100_000 === 0 ? 0 : 1)}L`;
  if (abs >= 1_000) return `${sign}৳${(abs / 1_000).toFixed(abs % 1_000 === 0 ? 0 : 1)}K`;
  return `${sign}৳${abs.toFixed(0)}`;
}
function formatAxisBDT(value: number | string) {
  return formatCompactBDT(Number(value ?? 0));
}
function formatTooltipBDT(value: number | string | undefined) {
  return formatBDT(Number(value ?? 0));
}
function formatCount(value: number | string | undefined) {
  return new Intl.NumberFormat("en-BD").format(Number(value ?? 0));
}
function shortMonth(m: string) {
  const [y, mo] = m.split("-");
  const d = new Date(Number(y), Number(mo) - 1, 1);
  return d.toLocaleString("en-US", { month: "short" });
}
function sliceByRange<T>(rows: T[], range: DateRange) {
  const n = range === "3M" ? 3 : range === "6M" ? 6 : 12;
  return rows.slice(-n);
}
function momDelta(current?: number, previous?: number) {
  if (current == null || previous == null || previous === 0) return null;
  const pct = ((current - previous) / Math.abs(previous)) * 100;
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(1)}% vs prior month`;
}

function statusVariant(status: string): "success" | "warning" | "danger" | "info" | "neutral" {
  const s = status.toUpperCase();
  if (["COMPLETED", "APPROVED", "ACTIVE", "VERIFIED", "DISMISSED"].includes(s)) return "success";
  if (["PENDING", "UNDER_REVIEW", "OPEN", "ESCALATED"].includes(s)) return "warning";
  if (["FAILED", "REJECTED", "REVERSED", "BLOCKED", "FROZEN"].includes(s)) return "danger";
  if (["PROCESSING"].includes(s)) return "info";
  return "neutral";
}

function KpiSkeleton() {
  return <Skeleton className="h-[132px] w-full rounded-[12px]" />;
}

export default function AdminDashboard() {
  const [range, setRange] = useState<DateRange>("12M");
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  const { data, isLoading, error } = useGetAdminAnalyticsQuery();
  const flags = useListSuspiciousFlagsQuery({ page: 1, pageSize: 5, status: "OPEN" });
  const pendingLoans = useListLoansQuery({ page: 1, pageSize: 5, status: "PENDING" });
  const reviewLoans = useListLoansQuery({ page: 1, pageSize: 5, status: "UNDER_REVIEW" });
  const recentTx = useListTransactionsQuery({ page: 1, pageSize: 5 });

  const a = data?.data;

  const monthlyVolume = useMemo(() => sliceByRange(a?.monthlyVolume ?? [], range).map((r) => ({ ...r, label: shortMonth(r.month) })), [a?.monthlyVolume, range]);
  const depositVsWithdrawal = useMemo(() => sliceByRange(a?.depositVsWithdrawal ?? [], range).map((r) => ({ ...r, label: shortMonth(r.month) })), [a?.depositVsWithdrawal, range]);
  const monthlyActivity = useMemo(() => sliceByRange(a?.monthlyActivity ?? [], range).map((r) => ({ ...r, label: shortMonth(r.month) })), [a?.monthlyActivity, range]);
  const accountDistribution = useMemo(() => (a?.accountDistribution ?? []).map((d) => ({ ...d, name: d.type.replace(/_/g, " ") })), [a?.accountDistribution]);
  const loanStats = useMemo(() => (a?.loanStats ?? []).map((d) => ({ ...d, name: d.status.replace(/_/g, " ") })), [a?.loanStats]);

  const kpiDeltas = useMemo(() => {
    const mv = a?.monthlyVolume ?? [];
    const dw = a?.depositVsWithdrawal ?? [];
    const ma = a?.monthlyActivity ?? [];
    const last = mv[mv.length - 1];
    const prev = mv[mv.length - 2];
    const lastDw = dw[dw.length - 1];
    const prevDw = dw[dw.length - 2];
    const lastMa = ma[ma.length - 1];
    const prevMa = ma[ma.length - 2];
    return {
      deposits: momDelta(lastDw?.deposits, prevDw?.deposits),
      withdrawals: momDelta(lastDw?.withdrawals, prevDw?.withdrawals),
      transactions: momDelta(lastMa?.count, prevMa?.count),
      volume: momDelta(last?.volume, prev?.volume),
    };
  }, [a]);

  const balanceSparkline = monthlyVolume.map((r) => ({ label: r.label, value: r.volume }));

  const pendingLoanRows = useMemo(() => {
    const p = pendingLoans.data?.data ?? [];
    const u = reviewLoans.data?.data ?? [];
    const map = new Map<string, (typeof p)[number]>();
    for (const row of [...p, ...u]) map.set(row.id, row);
    return Array.from(map.values()).slice(0, 5);
  }, [pendingLoans.data, reviewLoans.data]);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error || !a) {
    return (
      <div className="space-y-4">
        <PageHeader title="Admin Dashboard" description="Platform overview and analytics." />
        <div className="rounded-[12px] border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive" role="alert">
          Failed to load analytics. Please refresh and try again.
        </div>
      </div>
    );
  }

  const donutTotal = accountDistribution.reduce((s, r) => s + r.count, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Dashboard"
        description="Platform overview, operational signals, and workload requiring review."
        breadcrumb={<span>Workspace / Dashboard</span>}
        showRange
        range={range}
        onRangeChange={setRange}
        actions={
          <Link href="/admin/requests" className={cn(buttonVariants(), "rounded-[8px] bg-[#0E7C66] text-white hover:bg-[#0E7C66]/90")}>
            Review requests
          </Link>
        }
      />

      <section aria-label="Key performance indicators" className="space-y-4">
        <div className="grid gap-4 xl:grid-cols-12">
          <div className="xl:col-span-6">
            <StatCard
              title="Total Bank Balance"
              value={formatCompactBDT(Number(a.kpis.totalBalance))}
              valueTooltip={formatBDT(a.kpis.totalBalance)}
              icon={<Landmark className="size-4" aria-hidden="true" />}
              description="Monthly transaction volume trend"
              delta={kpiDeltas.volume ?? undefined}
              deltaTone={kpiDeltas.volume?.startsWith("+") ? "positive" : kpiDeltas.volume?.startsWith("-") ? "negative" : "neutral"}
              featured
              background={
                <div className="h-full w-full opacity-70">
                  <GlassFold speed={isMobile ? 0 : 0.2} scale={1.2} noise={0.06} />
                </div>
              }
              className="min-h-[168px]"
              valueClassName="text-4xl sm:text-5xl"
              contentClassName="p-6"
            />
            <div className="mt-3 h-14 rounded-[10px] border border-[#0E7C66]/20 bg-[#0E7C66]/[0.04] px-3 py-2 dark:bg-[#0E7C66]/10">
              {balanceSparkline.length > 1 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={balanceSparkline} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="balanceSpark" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={BRAND.primary} stopOpacity={0.25} />
                        <stop offset="95%" stopColor={BRAND.primary} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Tooltip formatter={(v) => formatTooltipBDT(v as number)} labelFormatter={(l) => `Month: ${l}`} />
                    <Area type="monotone" dataKey="value" stroke={BRAND.primary} fill="url(#balanceSpark)" strokeWidth={2} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center text-xs text-muted-foreground">No trend data yet</div>
              )}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:col-span-6">
            <StatCard title="Total Deposits" value={formatCompactBDT(Number(a.kpis.totalDeposits))} valueTooltip={formatBDT(a.kpis.totalDeposits)} icon={<ArrowDownLeft className="size-4" aria-hidden="true" />} delta={kpiDeltas.deposits ?? undefined} deltaTone={kpiDeltas.deposits?.startsWith("+") ? "positive" : kpiDeltas.deposits?.startsWith("-") ? "negative" : "neutral"} description="Completed deposits" />
            <StatCard title="Total Withdrawals" value={formatCompactBDT(Number(a.kpis.totalWithdrawals))} valueTooltip={formatBDT(a.kpis.totalWithdrawals)} icon={<ArrowUpRight className="size-4" aria-hidden="true" />} delta={kpiDeltas.withdrawals ?? undefined} deltaTone={kpiDeltas.withdrawals?.startsWith("-") ? "positive" : kpiDeltas.withdrawals?.startsWith("+") ? "negative" : "neutral"} description="Completed withdrawals" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Total Customers" value={formatCount(a.kpis.totalCustomers)} icon={<Users className="size-4" aria-hidden="true" />} />
          <StatCard title="Total Accounts" value={formatCount(a.kpis.totalAccounts)} icon={<Wallet className="size-4" aria-hidden="true" />} />
          <StatCard title="Total Transactions" value={formatCount(a.kpis.totalTransactions)} icon={<ReceiptText className="size-4" aria-hidden="true" />} delta={kpiDeltas.transactions ?? undefined} deltaTone={kpiDeltas.transactions?.startsWith("+") ? "positive" : kpiDeltas.transactions?.startsWith("-") ? "negative" : "neutral"} description="Completed transactions" />
          <StatCard title="Pending Loan Applications" value={formatCount(a.kpis.pendingLoans)} icon={<ShieldAlert className="size-4" aria-hidden="true" />} description="Pending and under review" />
        </div>

        <div className="flex flex-wrap gap-2" aria-label="Secondary KPIs">
          <SecondaryChip label="Active Loans" value={formatCount(a.kpis.activeLoans)} />
          <SecondaryChip label="Open Flags" value={formatCount(a.kpis.openFlags)} tone={a.kpis.openFlags > 0 ? "warning" : "neutral"} />
          <SecondaryChip label="Pending Requests" value={formatCount(a.kpis.pendingRequests)} tone={a.kpis.pendingRequests > 0 ? "warning" : "neutral"} />
        </div>
      </section>

      <section aria-label="Analytics charts" className="grid gap-4 xl:grid-cols-2">
        <ChartCard title="Monthly Transaction Volume" description={`Completed transaction volume for the selected ${range} period.`}>
          {monthlyVolume.length === 0 ? <EmptyState className="min-h-[280px]" /> : (
            <div className="h-[280px]">
              <div className="mb-2 flex items-center gap-4 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-[#0E7C66]" aria-hidden="true" />Volume</span>
              </div>
              <ResponsiveContainer width="100%" height="90%">
                <BarChart data={monthlyVolume} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                  <YAxis tickFormatter={formatAxisBDT} tick={{ fontSize: 12 }} width={72} tickLine={false} axisLine={false} />
                  <Tooltip formatter={(v) => formatTooltipBDT(v as number)} />
                  <Bar dataKey="volume" fill={BRAND.primary} name="Volume" maxBarSize={44} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>

        <ChartCard title="Deposit vs Withdrawal" description={`Completed deposits and withdrawals for the selected ${range} period.`}>
          {depositVsWithdrawal.length === 0 ? <EmptyState className="min-h-[280px]" /> : (
            <div className="h-[280px]">
              <div className="mb-2 flex items-center gap-4 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-[#0E7C66]" aria-hidden="true" />Deposits</span>
                <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-[#D97706]" aria-hidden="true" />Withdrawals</span>
              </div>
              <ResponsiveContainer width="100%" height="90%">
                <BarChart data={depositVsWithdrawal} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                  <YAxis tickFormatter={formatAxisBDT} tick={{ fontSize: 12 }} width={72} tickLine={false} axisLine={false} />
                  <Tooltip formatter={(v) => formatTooltipBDT(v as number)} />
                  <Bar dataKey="deposits" fill={BRAND.primary} name="Deposits" maxBarSize={32} radius={[6, 6, 0, 0]} />
                  <Bar dataKey="withdrawals" fill="#D97706" name="Withdrawals" maxBarSize={32} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>

        <ChartCard title="Account Distribution" description="Active non-system accounts by type. Not time-sliced.">
          {accountDistribution.length === 0 ? <EmptyState className="min-h-[280px]" /> : (
            <div className="grid h-[280px] gap-4 md:grid-cols-[1fr_180px]">
              <div className="relative min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={accountDistribution} dataKey="count" nameKey="name" outerRadius={92} innerRadius={58} paddingAngle={2}>
                      {accountDistribution.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v) => formatCount(v as number)} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-heading text-2xl font-semibold tabular-nums text-foreground">{formatCount(donutTotal)}</span>
                  <span className="text-xs text-muted-foreground">Accounts</span>
                </div>
              </div>
              <div className="flex flex-col justify-center gap-2 text-sm">
                {accountDistribution.map((row, i) => {
                  const pct = donutTotal ? ((row.count / donutTotal) * 100).toFixed(1) : "0.0";
                  return (
                    <div key={row.type} className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} aria-hidden="true" />
                        <span className="truncate text-muted-foreground">{row.name}</span>
                      </div>
                      <span className="shrink-0 font-mono text-xs tabular-nums text-foreground">{formatCount(row.count)} · {pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </ChartCard>

        <ChartCard title="Loan Approval Statistics" description="Loan applications by current status. Not time-sliced.">
          {loanStats.length === 0 ? <EmptyState className="min-h-[280px]" /> : (
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={loanStats} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={110} tickLine={false} axisLine={false} />
                  <Tooltip formatter={(v) => formatCount(v as number)} />
                  <Bar dataKey="count" fill={BRAND.secondary} name="Loans" maxBarSize={28} radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>

        <ChartCard title="Monthly Banking Activity" description={`Transaction count and volume for the selected ${range} period.`} className="xl:col-span-2">
          {monthlyActivity.length === 0 ? <EmptyState className="min-h-[280px]" /> : (
            <div className="h-[280px]">
              <div className="mb-2 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-[#0E7C66]" aria-hidden="true" />Volume</span>
                <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-[#1F3A5F]" aria-hidden="true" />Tx count</span>
              </div>
              <ResponsiveContainer width="100%" height="90%">
                <AreaChart data={monthlyActivity} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="activityVolume" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={BRAND.primary} stopOpacity={0.18} />
                      <stop offset="95%" stopColor={BRAND.primary} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="count" allowDecimals={false} tick={{ fontSize: 12 }} width={40} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="volume" orientation="right" tickFormatter={formatAxisBDT} tick={{ fontSize: 12 }} width={72} tickLine={false} axisLine={false} />
                  <Tooltip formatter={(v, name) => name === "Volume" ? formatTooltipBDT(v as number) : formatCount(v as number)} />
                  <Area yAxisId="volume" type="monotone" dataKey="volume" stroke={BRAND.primary} fill="url(#activityVolume)" strokeWidth={2} name="Volume" />
                  <Line yAxisId="count" type="monotone" dataKey="count" stroke={BRAND.secondary} strokeWidth={2} dot={{ r: 3 }} name="Tx count" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>
      </section>

      <section aria-label="Work panels" className="grid gap-4 xl:grid-cols-3">
        <WorkPanel
          title="Suspicious queue"
          description="Open flags requiring review."
          action={<Link href="/admin/suspicious" className="text-sm font-medium text-[#0E7C66] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7C66]">View all</Link>}
        >
          {flags.isLoading ? <PanelSkeleton rows={4} /> : (flags.data?.data.length ?? 0) === 0 ? (
            <EmptyState title="No open flags" description="No suspicious activity is waiting for review." className="min-h-[180px]" />
          ) : (
            <div className="space-y-3">
              {(flags.data?.data ?? []).map((f) => (
                <div key={f.id} className="flex items-start justify-between gap-3 rounded-[10px] border border-border p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{f.reason}</p>
                    <p className="mt-1 font-mono text-xs text-muted-foreground">{f.transaction.reference}</p>
                    <div className="mt-2"><StatusBadge variant={statusVariant(f.status)}>{f.status}</StatusBadge></div>
                  </div>
                  <Link href="/admin/suspicious" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "shrink-0 rounded-[8px]")}>
                    Review
                  </Link>
                </div>
              ))}
            </div>
          )}
        </WorkPanel>

        <WorkPanel
          title="Pending loan applications"
          description="Applications waiting for review or decision."
          action={<Link href="/admin/loans" className="text-sm font-medium text-[#0E7C66] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7C66]">View all</Link>}
        >
          {(pendingLoans.isLoading || reviewLoans.isLoading) ? <PanelSkeleton rows={4} /> : pendingLoanRows.length === 0 ? (
            <EmptyState title="No pending loans" description="No loan applications are waiting for review." className="min-h-[180px]" />
          ) : (
            <div className="space-y-3">
              {pendingLoanRows.map((loan) => (
                <div key={loan.id} className="flex items-start justify-between gap-3 rounded-[10px] border border-border p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{loan.applicant?.name ?? "Unknown applicant"}</p>
                    <p className="mt-1 font-mono text-xs tabular-nums text-muted-foreground">{formatBDT(loan.requestedAmount)}</p>
                    <div className="mt-2"><StatusBadge variant={statusVariant(loan.status)}>{loan.status.replace(/_/g, " ")}</StatusBadge></div>
                  </div>
                  <Link href="/admin/loans" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "shrink-0 rounded-[8px]")}>
                    Review
                  </Link>
                </div>
              ))}
            </div>
          )}
        </WorkPanel>

        <WorkPanel
          title="Recent transactions"
          description="Latest transactions across the platform."
          action={<Link href="/admin/transactions" className="text-sm font-medium text-[#0E7C66] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7C66]">View all</Link>}
        >
          {recentTx.isLoading ? <PanelSkeleton rows={5} /> : (recentTx.data?.data.length ?? 0) === 0 ? (
            <EmptyState title="No transactions yet" description="Transactions will appear here when activity occurs." className="min-h-[180px]" />
          ) : (
            <DataTable
              columns={[
                {
                  key: "reference",
                  header: "ID",
                  cell: (tx) => <span className="font-mono text-xs text-foreground">{tx.reference}</span>,
                },
                {
                  key: "type",
                  header: "Type",
                  cell: (tx) => <span className="text-xs text-muted-foreground">{tx.type.replace(/_/g, " ")}</span>,
                },
                {
                  key: "amount",
                  header: "Amount",
                  headerClassName: "text-right",
                  className: "text-right",
                  cell: (tx) => <span className="font-mono text-xs tabular-nums text-foreground">{formatBDT(tx.amount)}</span>,
                },
                {
                  key: "status",
                  header: "Status",
                  headerClassName: "text-right",
                  className: "text-right",
                  cell: (tx) => <StatusBadge variant={statusVariant(tx.status)}>{tx.status}</StatusBadge>,
                },
              ]}
              rows={recentTx.data?.data ?? []}
              rowKey={(tx) => tx.id}
            />
          )}
        </WorkPanel>
      </section>
    </div>
  );
}

function SecondaryChip({ label, value, tone = "neutral" }: { label: string; value: string; tone?: "neutral" | "warning" }) {
  return (
    <div className={cn("inline-flex items-center gap-2 rounded-[8px] border px-3 py-2 text-sm", tone === "warning" ? "border-[#FCD34D]/60 bg-[#FEF3C7]/50 text-[#92400E] dark:border-[#92400e]/50 dark:bg-[#2a1600]/40 dark:text-[#FCD34D]" : "border-border bg-card text-foreground")}>
      <span className="text-muted-foreground">{label}</span>
      <span className="font-heading font-semibold tabular-nums text-foreground dark:text-inherit">{value}</span>
    </div>
  );
}

function WorkPanel({ title, description, action, children }: { title: string; description: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-[12px] border border-border bg-card p-5 shadow-none">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-base font-semibold tracking-tight text-foreground">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function PanelSkeleton({ rows }: { rows: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-[10px]" />)}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="grid gap-4 xl:grid-cols-12">
        <div className="xl:col-span-6 space-y-3"><KpiSkeleton /><Skeleton className="h-14 w-full rounded-[10px]" /></div>
        <div className="grid gap-4 sm:grid-cols-2 xl:col-span-6"><KpiSkeleton /><KpiSkeleton /></div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <KpiSkeleton key={i} />)}</div>
      <div className="flex gap-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-36 rounded-[8px]" />)}</div>
      <div className="grid gap-4 xl:grid-cols-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className={cn("h-[360px] w-full rounded-[12px]", i === 4 && "xl:col-span-2")} />)}</div>
      <div className="grid gap-4 xl:grid-cols-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-[320px] w-full rounded-[12px]" />)}</div>
    </div>
  );
}
