import { baseApi } from "./baseApi";

export type AnalyticsSummary = {
  kpis: {
    totalCustomers: number;
    totalAccounts: number;
    totalBalance: string;
    pendingLoans: number;
    activeLoans: number;
    openFlags: number;
    pendingRequests: number;
  };
  monthlyVolume: { month: string; volume: number; count: number }[];
  depositVsWithdrawal: { month: string; deposits: number; withdrawals: number }[];
  accountDistribution: { type: string; count: number }[];
  loanStats: { status: string; count: number }[];
  monthlyActivity: { month: string; count: number; volume: number }[];
};

export const analyticsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getAdminAnalytics: build.query<{ data: AnalyticsSummary }, void>({
      query: () => "/admin/analytics",
      providesTags: ["Analytics"],
    }),
  }),
});

export const { useGetAdminAnalyticsQuery } = analyticsApi;
