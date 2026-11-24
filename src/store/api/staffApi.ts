import { baseApi } from "./baseApi";

export type StaffUser = {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

type ListResponse<T> = {
  data: T[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
};

export const staffApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listStaff: build.query<
      ListResponse<StaffUser>,
      { page?: number; pageSize?: number; q?: string } | void
    >({
      query: (params) => ({ url: "/admin/staff", params: params ?? undefined }),
      providesTags: [{ type: "Staff", id: "LIST" }],
    }),
    createStaff: build.mutation<
      { data: { staff: StaffUser } },
      { name: string; email: string; phone?: string; temporaryPassword: string }
    >({
      query: (body) => ({ url: "/admin/staff", method: "POST", body }),
      invalidatesTags: [{ type: "Staff", id: "LIST" }],
    }),
    updateStaffStatus: build.mutation<
      { data: StaffUser },
      { id: string; status: "ACTIVE" | "INACTIVE" }
    >({
      query: ({ id, status }) => ({
        url: `/admin/staff/${id}/status`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: "Staff", id: "LIST" },
        { type: "Staff", id },
      ],
    }),
  }),
});

export const { useListStaffQuery, useCreateStaffMutation, useUpdateStaffStatusMutation } = staffApi;
