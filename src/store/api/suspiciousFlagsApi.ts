import { baseApi } from "./baseApi";

export type SuspiciousFlag = {
  id: string;
  transactionId: string;
  source: string;
  ruleCode: string | null;
  reason: string;
  status: "OPEN" | "DISMISSED" | "ESCALATED";
  raisedById: string | null;
  resolvedById: string | null;
  resolutionNote: string | null;
  createdAt: string;
  resolvedAt: string | null;
  transaction: {
    id: string;
    reference: string;
    type: string;
    status: string;
    amount: string;
    currency: string;
    createdAt: string;
  };
  raisedBy: { id: string; name: string; role: string } | null;
  resolvedBy: { id: string; name: string; role: string } | null;
};

type ListResponse<T> = {
  data: T[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
};

export const suspiciousFlagsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listSuspiciousFlags: build.query<
      ListResponse<SuspiciousFlag>,
      { page?: number; pageSize?: number; status?: string } | void
    >({
      query: (params) => ({ url: "/suspicious-flags", params: params ?? undefined }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map((f) => ({ type: "SuspiciousFlag" as const, id: f.id })),
              { type: "SuspiciousFlag", id: "LIST" },
            ]
          : [{ type: "SuspiciousFlag", id: "LIST" }],
    }),
    resolveSuspiciousFlag: build.mutation<
      { data: SuspiciousFlag },
      { id: string; status: "DISMISSED" | "ESCALATED"; resolutionNote: string }
    >({
      query: ({ id, ...body }) => ({ url: `/suspicious-flags/${id}`, method: "PATCH", body }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: "SuspiciousFlag", id: "LIST" },
        { type: "SuspiciousFlag", id },
      ],
    }),
  }),
});

export const { useListSuspiciousFlagsQuery, useResolveSuspiciousFlagMutation } = suspiciousFlagsApi;
