import { baseApi } from "./baseApi";

export type MyProfile = {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: string;
  status: string;
  twoFactorEnabled: boolean;
  theme: "light" | "dark" | "system";
  hasPin: boolean;
  createdAt: string;
  updatedAt: string;
  profile: {
    customerNo: string;
    nid: string;
    kycStatus: string;
    dateOfBirth: string;
    presentAddress: string;
    occupation: string | null;
  } | null;
};

export const profileApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getMe: build.query<{ data: MyProfile }, void>({
      query: () => "/me",
      providesTags: ["Profile"],
    }),
    updateMe: build.mutation<{ data: MyProfile }, { name?: string; phone?: string | null }>({
      query: (body) => ({ url: "/me", method: "PATCH", body }),
      invalidatesTags: ["Profile"],
    }),
    changePassword: build.mutation<
      { data: { ok: boolean } },
      { currentPassword: string; newPassword: string }
    >({
      query: (body) => ({ url: "/me/password", method: "POST", body }),
    }),
    setPin: build.mutation<
      { data: { ok: boolean; hasPin: boolean } },
      { currentPin?: string; newPin: string }
    >({
      query: (body) => ({ url: "/me/pin", method: "POST", body }),
      invalidatesTags: ["Profile"],
    }),
    toggle2fa: build.mutation<{ data: { twoFactorEnabled: boolean } }, { enabled: boolean }>({
      query: (body) => ({ url: "/me/2fa", method: "POST", body }),
      invalidatesTags: ["Profile"],
    }),
    updateTheme: build.mutation<
      { data: { theme: "light" | "dark" | "system" } },
      { theme: "light" | "dark" | "system" }
    >({
      query: (body) => ({ url: "/me/theme", method: "PATCH", body }),
      invalidatesTags: ["Profile"],
    }),
  }),
});

export const {
  useGetMeQuery,
  useUpdateMeMutation,
  useChangePasswordMutation,
  useSetPinMutation,
  useToggle2faMutation,
  useUpdateThemeMutation,
} = profileApi;
