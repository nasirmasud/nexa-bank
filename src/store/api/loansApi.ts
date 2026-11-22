import { baseApi } from "./baseApi";

export type Loan = {
  id: string;
  loanNo: string;
  applicantId: string;
  type: string;
  requestedAmount: string;
  approvedAmount: string | null;
  durationMonths: number;
  interestRate: string;
  emiAmount: string | null;
  monthlyIncome: string;
  employmentStatus: string;
  description: string | null;
  status: string;
  disbursementAccountId: string | null;
  reviewedById: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  appliedAt: string;
  disbursedAt: string | null;
  applicant?: { id: string; name: string; email: string };
};

type ListResponse<T> = {
  data: T[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
};

export const loansApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listLoans: build.query<
      ListResponse<Loan>,
      { page?: number; pageSize?: number; status?: string; q?: string } | void
    >({
      query: (params) => ({ url: "/loans", params: params ?? undefined }),
      providesTags: [{ type: "Loan", id: "LIST" }],
    }),
    getLoan: build.query<{ data: Loan }, string>({
      query: (id) => `/loans/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Loan", id }],
    }),
    approveLoan: build.mutation<
      { data: unknown },
      { id: string; disbursementAccountId: string; approvedAmount?: string }
    >({
      query: ({ id, ...body }) => ({ url: `/loans/${id}/approve`, method: "POST", body }),
      invalidatesTags: [{ type: "Loan", id: "LIST" }],
    }),
    rejectLoan: build.mutation<{ data: Loan }, { id: string; reason: string }>({
      query: ({ id, reason }) => ({ url: `/loans/${id}/reject`, method: "POST", body: { reason } }),
      invalidatesTags: [{ type: "Loan", id: "LIST" }],
    }),
    forwardLoan: build.mutation<{ data: Loan }, { id: string; note?: string }>({
      query: ({ id, ...body }) => ({ url: `/loans/${id}/forward`, method: "POST", body }),
      invalidatesTags: [{ type: "Loan", id: "LIST" }],
    }),
    addLoanNote: build.mutation<
      { data: unknown },
      { id: string; body: string; internal?: boolean }
    >({
      query: ({ id, ...body }) => ({ url: `/loans/${id}/notes`, method: "POST", body }),
      invalidatesTags: (_r, _e, { id }) => [{ type: "Loan", id }],
    }),
  }),
});

export const {
  useListLoansQuery,
  useGetLoanQuery,
  useApproveLoanMutation,
  useRejectLoanMutation,
  useForwardLoanMutation,
  useAddLoanNoteMutation,
} = loansApi;
