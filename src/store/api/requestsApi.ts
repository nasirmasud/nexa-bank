import { baseApi } from "./baseApi";

export type MoneyRequest = {
  id: string;
  type: "DEPOSIT" | "WITHDRAWAL";
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  accountId: string;
  requesterId: string;
  amount: string;
  description: string | null;
  requestedAt: string;
  reviewedById: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
};

type ListResponse<T> = {
  data: T[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
};

export const requestsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listRequests: build.query<
      ListResponse<MoneyRequest>,
      { page?: number; pageSize?: number; status?: string } | void
    >({
      query: (params) => ({ url: "/requests", params: params ?? undefined }),
      providesTags: [{ type: "Request", id: "LIST" }],
    }),
  }),
});

export const { useListRequestsQuery } = requestsApi;
