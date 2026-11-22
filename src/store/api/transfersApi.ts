import { baseApi } from "./baseApi";

export type TransferResult = {
  transaction: {
    id: string;
    reference: string;
    type: string;
    status: string;
    amount: string;
    fee: string;
    currency: string;
    description: string | null;
    fromAccountId: string | null;
    toAccountId: string | null;
    createdAt: string;
    completedAt: string | null;
  };
};

export const transfersApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    createTransfer: build.mutation<{ data: TransferResult }, Record<string, unknown>>({
      query: (body) => ({ url: "/transfers", method: "POST", body }),
      invalidatesTags: [
        { type: "Account", id: "LIST" },
        { type: "Transaction", id: "LIST" },
      ],
    }),
  }),
});

export const { useCreateTransferMutation } = transfersApi;
