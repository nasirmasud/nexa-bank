import { prisma } from "@/lib/prisma";
import { withApi } from "@/lib/withApi";
import { requireAuth } from "@/lib/guards";
import { notificationListSchema } from "@/lib/validators/notification";
import { listMyNotifications } from "@/lib/services/notificationService";

export const GET = withApi(async (request) => {
  const user = await requireAuth();
  const url = new URL(request.url);
  const input = notificationListSchema.parse(Object.fromEntries(url.searchParams));
  const result = await listMyNotifications(prisma, user, input);
  return Response.json({ data: result.items, pagination: result.pagination });
});
