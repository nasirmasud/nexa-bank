"use client";

import { useRouter } from "next/navigation";
import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  useListNotificationsQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
} from "@/store/api/notificationsApi";

export default function CustomerNotificationsPage() {
  const router = useRouter();
  const { data, isLoading } = useListNotificationsQuery({ page: 1, pageSize: 20 });
  const [markRead] = useMarkNotificationReadMutation();
  const [markAllRead, markAllState] = useMarkAllNotificationsReadMutation();
  const items = data?.data ?? [];
  const unread = items.filter((n) => !n.read).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Notifications</h1>
          <p className="mt-1 text-sm text-muted-foreground">Stay updated on account activity.</p>
        </div>
        <Button
          variant="outline"
          onClick={() => markAllRead()}
          disabled={markAllState.isLoading || unread === 0}
        >
          <CheckCheck className="size-4" />
          Mark all read
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
              <Bell className="size-8" />
              <p className="text-sm">No notifications yet.</p>
            </div>
          ) : (
            <div className="divide-y">
              {items.map((n) => (
                <button
                  key={n.id}
                  className={cn(
                    "flex w-full flex-col items-start gap-1 py-3 text-left hover:bg-muted/40",
                    !n.read && "bg-muted/20",
                  )}
                  onClick={async () => {
                    if (!n.read) await markRead(n.id);
                    if (n.link) router.push(n.link);
                  }}
                >
                  <div className="flex w-full items-center gap-2">
                    <span className="font-medium">{n.title}</span>
                    {!n.read && <span className="ml-auto size-2 rounded-full bg-primary" />}
                  </div>
                  <span className="text-sm text-muted-foreground">{n.message}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(n.createdAt).toLocaleString()}
                  </span>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
