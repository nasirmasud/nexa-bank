import { baseApi } from "./baseApi";

export type AuditLog = {
  id: string;
  actorId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  ip: string | null;
  createdAt: string;
  actor: { id: string; name: string; email: string } | null;
};

type ListResponse<T> = {
  data: T[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
};

export const auditLogsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listAuditLogs: build.query<
      ListResponse<AuditLog>,
      { page?: number; pageSize?: number; action?: string; entityType?: string } | void
    >({
      query: (params) => ({ url: "/admin/audit-logs", params: params ?? undefined }),
      providesTags: ["AuditLog"],
    }),
  }),
});

export const { useListAuditLogsQuery } = auditLogsApi;
