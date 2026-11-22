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
  }),
});

export const { useListCustomersQuery, useGetCustomerQuery, useCreateCustomerMutation } =
  customersApi;
