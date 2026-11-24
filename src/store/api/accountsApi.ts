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
    listAccounts: build.query<ListResponse<Account>, { page?: number; pageSize?: number; ownerId?: string; q?: string; status?: string; type?: string } | void>({
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
    lookupAccount: build.query<
      {
        data: {
          id: string;
          accountNumber: string;
          type: string;
          status: string;
          currency: string;
          owner: { name: string } | null;
        };
      },
      string
    >({
      query: (number) => ({ url: "/accounts/lookup", params: { number } }),
    }),
    createAccount: build.mutation<{ data: Account }, Record<string, unknown>>({
      query: (body) => ({ url: "/accounts", method: "POST", body }),
      invalidatesTags: [{ type: "Account", id: "LIST" }],
    }),
    freezeAccount: build.mutation<{ data: Account }, { id: string; reason: string }>({
      query: ({ id, reason }) => ({
        url: `/accounts/${id}/freeze`,
        method: "POST",
        body: { reason },
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: "Account", id: "LIST" },
        { type: "Account", id },
      ],
    }),
    unfreezeAccount: build.mutation<{ data: Account }, string>({
      query: (id) => ({ url: `/accounts/${id}/unfreeze`, method: "POST" }),
      invalidatesTags: (_r, _e, id) => [
        { type: "Account", id: "LIST" },
        { type: "Account", id },
      ],
    }),
    updateAccountLimits: build.mutation<
      { data: Account },
      {
        id: string;
        dailyTransferLimit?: string | null;
        perTxLimit?: string | null;
        minBalance?: string | null;
      }
    >({
      query: ({ id, ...body }) => ({ url: `/accounts/${id}/limits`, method: "PUT", body }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: "Account", id: "LIST" },
        { type: "Account", id },
      ],
    }),
  }),
});

export const {
  useListAccountsQuery,
  useGetAccountQuery,
  useLazyLookupAccountQuery,
  useCreateAccountMutation,
  useFreezeAccountMutation,
  useUnfreezeAccountMutation,
  useUpdateAccountLimitsMutation,
} = accountsApi;
