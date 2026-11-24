"use client";

import Link from "next/link";
import { useMemo, type ReactNode } from "react";
import { ClipboardList, Landmark, ReceiptText, ShieldAlert } from "lucide-react";

import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatBDT } from "@/lib/money";
import { cn } from "@/lib/utils";
import { useListLoansQuery } from "@/store/api/loansApi";
import { useListRequestsQuery } from "@/store/api/requestsApi";
import { useListSuspiciousFlagsQuery } from "@/store/api/suspiciousFlagsApi";
import { useListTransactionsQuery } from "@/store/api/transactionsApi";

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

export default function StaffDashboard() {
  const pendingRequests = useListRequestsQuery({ page: 1, pageSize: 1, status: "PENDING" });
  const recentRequests = useListRequestsQuery({ page: 1, pageSize: 5 });
  const openFlags = useListSuspiciousFlagsQuery({ page: 1, pageSize: 5, status: "OPEN" });
  const pendingLoans = useListLoansQuery({ page: 1, pageSize: 5, status: "PENDING" });
  const reviewLoans = useListLoansQuery({ page: 1, pageSize: 5, status: "UNDER_REVIEW" });
  const recentTx = useListTransactionsQuery({ page: 1, pageSize: 5 });

  const loadingKpis =
    pendingRequests.isLoading ||
    openFlags.isLoading ||
    pendingLoans.isLoading ||
    reviewLoans.isLoading ||
    recentTx.isLoading;

  const pendingLoanRows = useMemo(() => {
    const p = pendingLoans.data?.data ?? [];
    const u = reviewLoans.data?.data ?? [];
    const map = new Map<string, (typeof p)[number]>();
    for (const row of [...p, ...u]) map.set(row.id, row);
    return Array.from(map.values()).slice(0, 5);
  }, [pendingLoans.data, reviewLoans.data]);

  const pendingLoanCount =
    (pendingLoans.data?.pagination.total ?? 0) + (reviewLoans.data?.pagination.total ?? 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff Dashboard"
        description="Operational overview for request review, suspicious activity, and loan assistance."
        breadcrumb={<span>Workspace / Dashboard</span>}
        actions={
          <Link
            href="/staff/requests"
            className={cn(buttonVariants(), "rounded-[8px] bg-[#0E7C66] text-white hover:bg-[#0E7C66]/90")}
          >
            Review requests
          </Link>
        }
      />

      <section aria-label="Key performance indicators" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loadingKpis ? (
          Array.from({ length: 4 }).map((_, i) => <KpiSkeleton key={i} />)
        ) : (
          <>
            <StatCard
              title="Pending Requests"
              value={new Intl.NumberFormat("en-BD").format(pendingRequests.data?.pagination.total ?? 0)}
              icon={<ClipboardList className="size-4" aria-hidden="true" />}
              description="Deposit/withdrawal requests awaiting review"
            />
            <StatCard
              title="Pending Loans"
              value={new Intl.NumberFormat("en-BD").format(pendingLoanCount)}
              icon={<Landmark className="size-4" aria-hidden="true" />}
              description="Pending and under review"
            />
            <StatCard
              title="Open Suspicious Flags"
              value={new Intl.NumberFormat("en-BD").format(openFlags.data?.pagination.total ?? 0)}
              icon={<ShieldAlert className="size-4" aria-hidden="true" />}
              description="Flags awaiting admin/staff review"
            />
            <StatCard
              title="Recent Transactions"
              value={new Intl.NumberFormat("en-BD").format(recentTx.data?.pagination.total ?? 0)}
              icon={<ReceiptText className="size-4" aria-hidden="true" />}
              description="Total transactions visible to staff"
            />
          </>
        )}
      </section>

      <section aria-label="Work panels" className="grid gap-4 xl:grid-cols-3">
        <WorkPanel
          title="Pending requests"
          description="Latest deposit/withdrawal requests."
          action={
            <Link
              href="/staff/requests"
              className="text-sm font-medium text-[#0E7C66] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7C66]"
            >
              View all
            </Link>
          }
        >
          {recentRequests.isLoading ? (
            <PanelSkeleton rows={5} />
          ) : (recentRequests.data?.data.length ?? 0) === 0 ? (
            <EmptyState title="No requests found" description="Deposit and withdrawal requests will appear here." className="min-h-[180px]" />
          ) : (
            <DataTable
              columns={[
                {
                  key: "requester",
                  header: "Requester",
                  cell: (r) => <span className="text-sm text-foreground">{r.requester?.name ?? r.requesterId.slice(0, 8)}</span>,
                },
                {
                  key: "type",
                  header: "Type",
                  cell: (r) => <span className="text-xs text-muted-foreground">{r.type}</span>,
                },
                {
                  key: "amount",
                  header: "Amount",
                  headerClassName: "text-right",
                  className: "text-right",
                  cell: (r) => <span className="font-mono text-xs tabular-nums text-foreground">{formatBDT(r.amount)}</span>,
                },
                {
                  key: "status",
                  header: "Status",
                  headerClassName: "text-right",
                  className: "text-right",
                  cell: (r) => <StatusBadge variant={statusVariant(r.status)}>{r.status}</StatusBadge>,
                },
              ]}
              rows={recentRequests.data?.data ?? []}
              rowKey={(r) => r.id}
            />
          )}
        </WorkPanel>

        <WorkPanel
          title="Suspicious queue"
          description="Open flags requiring attention."
          action={
            <Link
              href="/staff/suspicious"
              className="text-sm font-medium text-[#0E7C66] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7C66]"
            >
              View all
            </Link>
          }
        >
          {openFlags.isLoading ? (
            <PanelSkeleton rows={4} />
          ) : (openFlags.data?.data.length ?? 0) === 0 ? (
            <EmptyState title="No open flags" description="No suspicious activity is waiting for review." className="min-h-[180px]" />
          ) : (
            <div className="space-y-3">
              {(openFlags.data?.data ?? []).map((f) => (
                <div key={f.id} className="flex items-start justify-between gap-3 rounded-[10px] border border-border p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{f.reason}</p>
                    <p className="mt-1 font-mono text-xs text-muted-foreground">{f.transaction.reference}</p>
                    <div className="mt-2">
                      <StatusBadge variant={statusVariant(f.status)}>{f.status}</StatusBadge>
                    </div>
                  </div>
                  <Link
                    href="/staff/suspicious"
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }), "shrink-0 rounded-[8px]")}
                  >
                    View
                  </Link>
                </div>
              ))}
            </div>
          )}
        </WorkPanel>

        <WorkPanel
          title="Loans needing attention"
          description="Pending and under-review loan applications."
          action={
            <Link
              href="/staff/loans"
              className="text-sm font-medium text-[#0E7C66] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7C66]"
            >
              View all
            </Link>
          }
        >
          {pendingLoans.isLoading || reviewLoans.isLoading ? (
            <PanelSkeleton rows={4} />
          ) : pendingLoanRows.length === 0 ? (
            <EmptyState title="No pending loans" description="No loan applications are waiting for review." className="min-h-[180px]" />
          ) : (
            <div className="space-y-3">
              {pendingLoanRows.map((loan) => (
                <div key={loan.id} className="flex items-start justify-between gap-3 rounded-[10px] border border-border p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{loan.applicant?.name ?? "Unknown applicant"}</p>
                    <p className="mt-1 font-mono text-xs tabular-nums text-muted-foreground">{formatBDT(loan.requestedAmount)}</p>
                    <div className="mt-2">
                      <StatusBadge variant={statusVariant(loan.status)}>{loan.status.replace(/_/g, " ")}</StatusBadge>
                    </div>
                  </div>
                  <Link
                    href="/staff/loans"
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }), "shrink-0 rounded-[8px]")}
                  >
                    View
                  </Link>
                </div>
              ))}
            </div>
          )}
        </WorkPanel>
      </section>

      <section aria-label="Recent transactions">
        <WorkPanel
          title="Recent transactions"
          description="Latest transactions visible in the staff workspace."
          action={
            <Link
              href="/staff/transactions"
              className="text-sm font-medium text-[#0E7C66] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7C66]"
            >
              View all
            </Link>
          }
        >
          {recentTx.isLoading ? (
            <PanelSkeleton rows={5} />
          ) : (recentTx.data?.data.length ?? 0) === 0 ? (
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

function WorkPanel({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  children: ReactNode;
}) {
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
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full rounded-[10px]" />
      ))}
    </div>
  );
}
