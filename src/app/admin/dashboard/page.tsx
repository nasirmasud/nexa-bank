"use client";

import { useMemo, useState } from "react";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatBDT } from "@/lib/money";
import { useGetAdminAnalyticsQuery } from "@/store/api/analyticsApi";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const BRAND = {
  primary: "#0E7C66",
  secondary: "#1F3A5F",
  amber: "#F59E0B",
  rose: "#E11D48",
  teal: "#2FBF9F",
  slate: "#64748B",
};

const PIE_COLORS = [BRAND.primary, BRAND.secondary, BRAND.amber, BRAND.teal, BRAND.rose, BRAND.slate];

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

function useHiddenSeries(keys: string[]) {
  const [hidden, setHidden] = useState<Record<string, boolean>>({});
  const toggle = (data: { dataKey?: unknown }) => {
    const key = typeof data.dataKey === "string" || typeof data.dataKey === "number" ? String(data.dataKey) : "";
    if (!key || !keys.includes(key)) return;
    setHidden((prev) => ({ ...prev, [key]: !prev[key] }));
  };
  const isHidden = (key: string) => Boolean(hidden[key]);
  return { hidden, toggle, isHidden };
}

export default function AdminDashboard() {
  const { data, isLoading, error } = useGetAdminAnalyticsQuery();
  const a = data?.data;

  const depWdLegend = useHiddenSeries(["deposits", "withdrawals"]);
  const activityLegend = useHiddenSeries(["count", "volume"]);

  const accountDistribution = useMemo(
    () => (a?.accountDistribution ?? []).map((d) => ({ ...d, name: d.type })),
    [a?.accountDistribution],
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">Platform overview and analytics.</p>
        </div>
        <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(170px,1fr))]">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className={`h-80 w-full ${i === 4 ? "xl:col-span-2" : ""}`} />
          ))}
        </div>
      </div>
    );
  }

  if (error || !a) {
    return (
      <div className="space-y-2">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Admin Dashboard</h1>
        <p className="text-sm text-destructive" role="alert">Failed to load analytics.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Platform overview and analytics.</p>
      </div>

      <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(170px,1fr))]">
        <StatCard title="Total Customers" value={formatCount(a.kpis.totalCustomers)} />
        <StatCard title="Total Accounts" value={formatCount(a.kpis.totalAccounts)} />
        <StatCard title="Total Bank Balance" value={formatBDT(a.kpis.totalBalance)} />
        <StatCard title="Total Deposits" value={formatBDT(a.kpis.totalDeposits)} />
        <StatCard title="Total Withdrawals" value={formatBDT(a.kpis.totalWithdrawals)} />
        <StatCard title="Total Transactions" value={formatCount(a.kpis.totalTransactions)} />
        <StatCard title="Pending Loan Applications" value={formatCount(a.kpis.pendingLoans)} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard title="Active Loans" value={formatCount(a.kpis.activeLoans)} className="py-3" valueClassName="text-xl" />
        <StatCard title="Open Flags" value={formatCount(a.kpis.openFlags)} className="py-3" valueClassName="text-xl" />
        <StatCard title="Pending Requests" value={formatCount(a.kpis.pendingRequests)} className="py-3" valueClassName="text-xl" />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard title="Monthly Transaction Volume">
          {a.monthlyVolume.length === 0 ? (
            <Empty />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={a.monthlyVolume} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={formatAxisBDT} tick={{ fontSize: 12 }} width={72} />
                <Tooltip formatter={(v) => formatTooltipBDT(v as number)} />
                <Bar dataKey="volume" fill={BRAND.primary} name="Volume" maxBarSize={44} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Deposit vs Withdrawal">
          {a.depositVsWithdrawal.length === 0 ? (
            <Empty />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={a.depositVsWithdrawal} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={formatAxisBDT} tick={{ fontSize: 12 }} width={72} />
                <Tooltip formatter={(v) => formatTooltipBDT(v as number)} />
                <Legend onClick={(d) => depWdLegend.toggle({ dataKey: d.dataKey })} wrapperStyle={{ cursor: "pointer", fontSize: 12 }} />
                <Bar dataKey="deposits" fill={BRAND.primary} name="Deposits" maxBarSize={32} radius={[4, 4, 0, 0]} hide={depWdLegend.isHidden("deposits")} />
                <Bar dataKey="withdrawals" fill={BRAND.rose} name="Withdrawals" maxBarSize={32} radius={[4, 4, 0, 0]} hide={depWdLegend.isHidden("withdrawals")} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Account Distribution">
          {accountDistribution.length === 0 ? (
            <Empty />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={accountDistribution} dataKey="count" nameKey="type" outerRadius={96} innerRadius={52} paddingAngle={2}>
                  {accountDistribution.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatCount(v as number)} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Loan Approval Statistics">
          {a.loanStats.length === 0 ? (
            <Empty />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={a.loanStats} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="status" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} width={40} />
                <Tooltip formatter={(v) => formatCount(v as number)} />
                <Bar dataKey="count" fill={BRAND.secondary} name="Loans" maxBarSize={48} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Monthly Banking Activity" className="xl:col-span-2">
          {a.monthlyActivity.length === 0 ? (
            <Empty />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={a.monthlyActivity} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="count" allowDecimals={false} tick={{ fontSize: 12 }} width={40} />
                <YAxis yAxisId="volume" orientation="right" tickFormatter={formatAxisBDT} tick={{ fontSize: 12 }} width={72} />
                <Tooltip
                  formatter={(v, name) =>
                    name === "Volume" ? formatTooltipBDT(v as number) : formatCount(v as number)
                  }
                />
                <Legend onClick={(d) => activityLegend.toggle({ dataKey: d.dataKey })} wrapperStyle={{ cursor: "pointer", fontSize: 12 }} />
                <Line yAxisId="count" type="monotone" dataKey="count" stroke={BRAND.secondary} strokeWidth={2} dot={{ r: 3 }} name="Tx count" hide={activityLegend.isHidden("count")} />
                <Line yAxisId="volume" type="monotone" dataKey="volume" stroke={BRAND.primary} strokeWidth={2} dot={{ r: 3 }} name="Volume" hide={activityLegend.isHidden("volume")} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>
    </div>
  );
}

function ChartCard({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-2">{children}</CardContent>
    </Card>
  );
}

function Empty() {
  return (
    <div className="flex h-[280px] items-center justify-center rounded-[8px] border border-dashed border-border bg-muted/20">
      <p className="text-sm text-muted-foreground">No data yet</p>
    </div>
  );
}
