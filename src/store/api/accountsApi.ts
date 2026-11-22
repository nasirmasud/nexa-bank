import { baseApi } from "./baseApi";

export type AccountOwner = { id: string; name: string; email: string } | null;

export type Account = {
  id: string;
  accountNumber: string;
  ownerId: string | null;
  type: "SAVINGS" | "CURRENT" | "BUSINESS" | "SYSTEM";
  status: "ACTIVE" | "FROZEN" | "CLOSED";
  currency: string;
  balance: string;
  dailyTransferLimit: string | null;
  perTxLimit: string | null;
  minBalance: string | null;
  nickname: string | null;
  freezeReason: string | null;
  openedAt: string;
  updatedAt: string;
  owner: AccountOwner;
};

type ListResponse<T> = {
  data: T[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
};

export const accountsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listAccounts: build.query<ListResponse<Account>, { page?: number; pageSize?: number } | void>({
      query: (params) => ({ url: "/accounts", params: params ?? undefined }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map((a) => ({ type: "Account" as const, id: a.id })),
              { type: "Account", id: "LIST" },
            ]
          : [{ type: "Account", id: "LIST" }],
    }),
    getAccount: build.query<{ data: Account }, string>({
      query: (id) => `/accounts/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Account", id }],
    }),
  }),
});

export const { useListAccountsQuery, useGetAccountQuery } = accountsApi;
