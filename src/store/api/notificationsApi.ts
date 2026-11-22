import { baseApi } from "./baseApi";

export type Notification = {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string;
};

type ListResponse<T> = {
  data: T[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
};

export const notificationsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listNotifications: build.query<
      ListResponse<Notification>,
      { page?: number; pageSize?: number; unreadOnly?: boolean } | void
    >({
      query: (params) => ({ url: "/notifications", params: params ?? undefined }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map((n) => ({ type: "Notification" as const, id: n.id })),
              { type: "Notification", id: "LIST" },
            ]
          : [{ type: "Notification", id: "LIST" }],
    }),
    getUnreadNotificationCount: build.query<{ data: { count: number } }, void>({
      query: () => "/notifications/unread-count",
      providesTags: [{ type: "Notification", id: "UNREAD" }],
    }),
    markNotificationRead: build.mutation<{ data: Notification }, string>({
      query: (id) => ({ url: `/notifications/${id}/read`, method: "POST" }),
      invalidatesTags: (_r, _e, id) => [
        { type: "Notification", id },
        { type: "Notification", id: "LIST" },
        { type: "Notification", id: "UNREAD" },
      ],
    }),
    markAllNotificationsRead: build.mutation<{ data: { updated: number } }, void>({
      query: () => ({ url: "/notifications/read-all", method: "POST" }),
      invalidatesTags: [
        { type: "Notification", id: "LIST" },
        { type: "Notification", id: "UNREAD" },
      ],
    }),
  }),
});

export const {
  useListNotificationsQuery,
  useGetUnreadNotificationCountQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} = notificationsApi;
