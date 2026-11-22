import { baseApi } from "./baseApi";

export type TxAccountRef = { id: string; accountNumber: string; ownerId: string | null } | null;

export type Transaction = {
  id: string;
  reference: string;
  type: "DEPOSIT" | "WITHDRAWAL" | "TRANSFER" | "LOAN_DISBURSEMENT" | "LOAN_REPAYMENT";
  status: "PENDING" | "COMPLETED" | "FAILED" | "REVERSED";
  fromAccountId: string | null;
  toAccountId: string | null;
  amount: string;
  fee: string;
  currency: string;
  description: string | null;
  failureReason: string | null;
  reversalOfId: string | null;
  initiatedById: string | null;
  requestId: string | null;
  createdAt: string;
  completedAt: string | null;
  fromAccount: TxAccountRef;
  toAccount: TxAccountRef;
};

type ListResponse<T> = {
  data: T[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
};

export type ListTransactionsParams = {
  page?: number;
  pageSize?: number;
  accountId?: string;
  type?: string;
  status?: string;
  from?: string;
  to?: string;
  q?: string;
};

export const transactionsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listTransactions: build.query<ListResponse<Transaction>, ListTransactionsParams | void>({
      query: (params) => ({ url: "/transactions", params: params ?? undefined }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map((t) => ({ type: "Transaction" as const, id: t.id })),
              { type: "Transaction", id: "LIST" },
            ]
          : [{ type: "Transaction", id: "LIST" }],
    }),
  }),
});

export const { useListTransactionsQuery } = transactionsApi;
