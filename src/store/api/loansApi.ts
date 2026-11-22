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
  disbursementTxId?: string | null;
  reviewedById: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  appliedAt: string;
  disbursedAt: string | null;
  completedAt?: string | null;
  totalPayable?: string | null;
  remainingBalance?: string | null;
  forwardedById?: string | null;
  applicant?: { id: string; name: string; email: string };
  reviewer?: { id: string; name: string; email: string } | null;
};

export type LoanInstallment = {
  id: string;
  number: number;
  dueDate: string;
  principal: string;
  interest: string;
  amount: string;
  status: string;
  paidAt: string | null;
};

export type LoanNote = {
  id: string;
  body: string;
  internal: boolean;
  createdAt: string;
  author: { id: string; name: string; role: string };
};

export type LoanDetail = Loan & {
  installments: LoanInstallment[];
  notes: LoanNote[];
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
    getLoan: build.query<{ data: LoanDetail }, string>({
      query: (id) => `/loans/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Loan", id }],
    }),
    approveLoan: build.mutation<
      { data: unknown },
      { id: string; disbursementAccountId: string; approvedAmount?: string }
    >({
      query: ({ id, ...body }) => ({ url: `/loans/${id}/approve`, method: "POST", body }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: "Loan", id: "LIST" },
        { type: "Loan", id },
      ],
    }),
    rejectLoan: build.mutation<{ data: Loan }, { id: string; reason: string }>({
      query: ({ id, reason }) => ({ url: `/loans/${id}/reject`, method: "POST", body: { reason } }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: "Loan", id: "LIST" },
        { type: "Loan", id },
      ],
    }),
    forwardLoan: build.mutation<{ data: Loan }, { id: string; note?: string }>({
      query: ({ id, ...body }) => ({ url: `/loans/${id}/forward`, method: "POST", body }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: "Loan", id: "LIST" },
        { type: "Loan", id },
      ],
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
