import { prisma } from "@/lib/prisma";
import { withApi } from "@/lib/withApi";
import { requireAuth } from "@/lib/guards";
import { markNotificationRead } from "@/lib/services/notificationService";

type Ctx = { params: Promise<{ id: string }> };

export const POST = withApi(async (_request, context) => {
  const user = await requireAuth();
  const { id } = await (context as Ctx).params;
  const notification = await markNotificationRead(prisma, user, id);
  return Response.json({ data: notification });
});
