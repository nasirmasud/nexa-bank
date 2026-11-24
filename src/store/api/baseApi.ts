import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { BaseQueryFn, FetchArgs } from "@reduxjs/toolkit/query";
import { signOut } from "next-auth/react";
import { toast } from "sonner";

const rawBaseQuery = fetchBaseQuery({ baseUrl: "/api", credentials: "include" });

export type ApiError = {
  status: number;
  code?: string;
  message: string;
  fields?: Record<string, string[]>;
};

const baseQueryWithErrorHandling: BaseQueryFn<string | FetchArgs, unknown, ApiError> = async (
  args,
  api,
  extraOptions,
) => {
  const result = await rawBaseQuery(args, api, extraOptions);

  if (result.error) {
    const status = typeof result.error.status === "number" ? result.error.status : 500;
    const data = result.error.data as
      | { error?: { code?: string; message?: string; fields?: Record<string, string[]> } }
      | undefined;
    const message = data?.error?.message || "Request failed";
    const code = data?.error?.code;
    const fields = data?.error?.fields;

    if (status === 401 && typeof window !== "undefined") {
      toast.error(message || "Session expired. Please sign in again.");
      await signOut({ callbackUrl: "/login" });
    } else if (status !== 401) {
      toast.error(message);
    }

    return { error: { status, code, message, fields } };
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithErrorHandling,
  tagTypes: [
    "Account",
    "Transaction",
    "Request",
    "Loan",
    "Notification",
    "Customer",
    "Analytics",
    "Settings",
    "Profile",
    "SuspiciousFlag",
    "AuditLog",
    "Staff",
  ],
  endpoints: () => ({}),
});
