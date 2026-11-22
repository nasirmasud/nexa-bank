import { prisma } from "@/lib/prisma";
import { withApi } from "@/lib/withApi";
import { requireAuth } from "@/lib/guards";
import { getUnreadNotificationCount } from "@/lib/services/notificationService";

export const GET = withApi(async () => {
  const user = await requireAuth();
  const result = await getUnreadNotificationCount(prisma, user);
  return Response.json({ data: result });
});
