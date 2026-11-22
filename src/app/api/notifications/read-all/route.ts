import { prisma } from "@/lib/prisma";
import { withApi } from "@/lib/withApi";
import { requireAuth } from "@/lib/guards";
import { markAllNotificationsRead } from "@/lib/services/notificationService";

export const POST = withApi(async () => {
  const user = await requireAuth();
  const result = await markAllNotificationsRead(prisma, user);
  return Response.json({ data: result });
});
