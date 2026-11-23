import { PrismaClient, Role } from "@prisma/client";
import { AppError } from "@/lib/errors";

export type AnalyticsActor = { id: string; role: Role };

type MonthRow = { month: string; volume: string | number; count: string | number };
type TypeRow = { month: string; deposits: string | number; withdrawals: string | number };

export async function getAdminAnalytics(db: PrismaClient, actor: AnalyticsActor) {
  if (actor.role !== Role.ADMIN) throw new AppError("FORBIDDEN", "Not authorized", 403);

  const now = new Date();
  const chartStart = new Date(now.getFullYear(), now.getMonth() - 11, 1);

  const [
    totalCustomers,
    totalAccounts,
    totalBalanceAgg,
    totalDepositsAgg,
    totalWithdrawalsAgg,
    totalTransactions,
    pendingLoans,
    activeLoans,
    openFlags,
    pendingRequests,
    accountDistribution,
    loanStats,
    monthlyVolumeRaw,
    depositVsWithdrawalRaw,
    monthlyActivityRaw,
  ] = await Promise.all([
    db.user.count({ where: { role: Role.CUSTOMER } }),
    db.account.count({ where: { type: { not: "SYSTEM" } } }),
    db.account.aggregate({
      where: { type: { not: "SYSTEM" } },
      _sum: { balance: true },
    }),
    db.transaction.aggregate({
      where: { type: "DEPOSIT", status: "COMPLETED" },
      _sum: { amount: true },
    }),
    db.transaction.aggregate({
      where: { type: "WITHDRAWAL", status: "COMPLETED" },
      _sum: { amount: true },
    }),
    db.transaction.count({ where: { status: "COMPLETED" } }),
    db.loan.count({ where: { status: { in: ["PENDING", "UNDER_REVIEW"] } } }),
    db.loan.count({ where: { status: "ACTIVE" } }),
    db.suspiciousFlag.count({ where: { status: "OPEN" } }),
    db.depositWithdrawRequest.count({ where: { status: "PENDING" } }),
    db.account.groupBy({
      by: ["type"],
      where: { type: { not: "SYSTEM" } },
      _count: { _all: true },
    }),
    db.loan.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    db.$queryRaw<MonthRow[]>`
      SELECT to_char(date_trunc('month', "createdAt"), 'YYYY-MM') AS month,
             COALESCE(SUM(amount), 0)::text AS volume,
             COUNT(*)::text AS count
      FROM "Transaction"
      WHERE "createdAt" >= ${chartStart} AND "status" = 'COMPLETED'
      GROUP BY 1
      ORDER BY 1
    `,
    db.$queryRaw<TypeRow[]>`
      SELECT to_char(date_trunc('month', "createdAt"), 'YYYY-MM') AS month,
             COALESCE(SUM(CASE WHEN "type" = 'DEPOSIT' THEN amount ELSE 0 END), 0)::text AS deposits,
             COALESCE(SUM(CASE WHEN "type" = 'WITHDRAWAL' THEN amount ELSE 0 END), 0)::text AS withdrawals
      FROM "Transaction"
      WHERE "createdAt" >= ${chartStart} AND "status" = 'COMPLETED'
      GROUP BY 1
      ORDER BY 1
    `,
    db.$queryRaw<MonthRow[]>`
      SELECT to_char(date_trunc('month', "createdAt"), 'YYYY-MM') AS month,
             COUNT(*)::text AS count,
             COALESCE(SUM(amount), 0)::text AS volume
      FROM "Transaction"
      WHERE "createdAt" >= ${chartStart} AND "status" = 'COMPLETED'
      GROUP BY 1
      ORDER BY 1
    `,
  ]);

  return {
    kpis: {
      totalCustomers,
      totalAccounts,
      totalBalance: totalBalanceAgg._sum.balance?.toString() ?? "0.00",
      totalDeposits: totalDepositsAgg._sum.amount?.toString() ?? "0.00",
      totalWithdrawals: totalWithdrawalsAgg._sum.amount?.toString() ?? "0.00",
      totalTransactions,
      pendingLoans,
      activeLoans,
      openFlags,
      pendingRequests,
    },
    monthlyVolume: monthlyVolumeRaw.map((r) => ({
      month: r.month,
      volume: Number(r.volume),
      count: Number(r.count),
    })),
    depositVsWithdrawal: depositVsWithdrawalRaw.map((r) => ({
      month: r.month,
      deposits: Number(r.deposits),
      withdrawals: Number(r.withdrawals),
    })),
    accountDistribution: accountDistribution.map((r) => ({
      type: r.type,
      count: r._count._all,
    })),
    loanStats: loanStats.map((r) => ({
      status: r.status,
      count: r._count._all,
    })),
    monthlyActivity: monthlyActivityRaw.map((r) => ({
      month: r.month,
      count: Number(r.count),
      volume: Number(r.volume),
    })),
  };
}
