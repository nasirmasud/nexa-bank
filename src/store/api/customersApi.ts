import { baseApi } from "./baseApi";

export type Customer = {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: string;
  status: string;
  createdAt: string;
  profile: {
    customerNo: string;
    nid: string;
    dateOfBirth: string;
    presentAddress: string;
    permanentAddress: string | null;
    occupation: string | null;
    kycStatus: string;
  } | null;
};

type ListResponse<T> = {
  data: T[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
};

export const customersApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listCustomers: build.query<
      ListResponse<Customer>,
      { page?: number; pageSize?: number; q?: string } | void
    >({
      query: (params) => ({ url: "/customers", params: params ?? undefined }),
      providesTags: [{ type: "Customer", id: "LIST" }],
    }),
    getCustomer: build.query<{ data: Customer }, string>({
      query: (id) => `/customers/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Customer", id }],
    }),
    createCustomer: build.mutation<
      { data: { customer: Customer; tempPassword: string | null } },
      Record<string, unknown>
    >({
      query: (body) => ({ url: "/customers", method: "POST", body }),
      invalidatesTags: [{ type: "Customer", id: "LIST" }],
    }),
    updateCustomerKyc: build.mutation<
      { data: Customer },
      { id: string; kycStatus: "PENDING" | "VERIFIED" | "REJECTED" }
    >({
      query: ({ id, kycStatus }) => ({
        url: `/customers/${id}/kyc`,
        method: "PATCH",
        body: { kycStatus },
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: "Customer", id: "LIST" },
        { type: "Customer", id },
      ],
    }),
    updateCustomerStatus: build.mutation<
      { data: Customer },
      { id: string; status: "ACTIVE" | "INACTIVE" | "BLOCKED" }
    >({
      query: ({ id, status }) => ({
        url: `/customers/${id}/status`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: "Customer", id: "LIST" },
        { type: "Customer", id },
      ],
    }),
    getCustomerTransactions: build.query<
      {
        data: {
          id: string;
          reference: string;
          type: string;
          status: string;
          amount: string;
          fee: string;
          currency: string;
          createdAt: string;
          fromAccount: { accountNumber: string } | null;
          toAccount: { accountNumber: string } | null;
        }[];
        pagination: { page: number; pageSize: number; total: number; totalPages: number };
      },
      { id: string; page?: number; pageSize?: number }
    >({
      query: ({ id, ...params }) => ({ url: `/customers/${id}/transactions`, params }),
      providesTags: (_r, _e, { id }) => [{ type: "Customer", id: `${id}-tx` }],
    }),
  }),
});

export const {
  useListCustomersQuery,
  useGetCustomerQuery,
  useCreateCustomerMutation,
  useUpdateCustomerKycMutation,
  useUpdateCustomerStatusMutation,
  useGetCustomerTransactionsQuery,
} = customersApi;
