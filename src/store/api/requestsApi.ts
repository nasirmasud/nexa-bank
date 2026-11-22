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
  account?: { id: string; accountNumber: string; ownerId: string | null };
  requester?: { id: string; name: string; email: string };
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
    createRequest: build.mutation<
      { data: MoneyRequest },
      { type: "DEPOSIT" | "WITHDRAWAL"; accountId: string; amount: string; description?: string }
    >({
      query: (body) => ({ url: "/requests", method: "POST", body }),
      invalidatesTags: [{ type: "Request", id: "LIST" }],
    }),
    cancelRequest: build.mutation<{ data: MoneyRequest }, string>({
      query: (id) => ({ url: `/requests/${id}/cancel`, method: "POST" }),
      invalidatesTags: [{ type: "Request", id: "LIST" }],
    }),
    approveRequest: build.mutation<{ data: MoneyRequest }, string>({
      query: (id) => ({ url: `/requests/${id}/approve`, method: "POST" }),
      invalidatesTags: [{ type: "Request", id: "LIST" }],
    }),
    rejectRequest: build.mutation<{ data: MoneyRequest }, { id: string; reason: string }>({
      query: ({ id, reason }) => ({
        url: `/requests/${id}/reject`,
        method: "POST",
        body: { reason },
      }),
      invalidatesTags: [{ type: "Request", id: "LIST" }],
    }),
  }),
});

export const {
  useListRequestsQuery,
  useCreateRequestMutation,
  useCancelRequestMutation,
  useApproveRequestMutation,
  useRejectRequestMutation,
} = requestsApi;
