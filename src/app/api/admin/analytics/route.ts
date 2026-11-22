import { prisma } from "@/lib/prisma";
import { withApi } from "@/lib/withApi";
import { requireRole } from "@/lib/guards";
import { getAdminAnalytics } from "@/lib/services/analyticsService";

export const GET = withApi(async () => {
  const user = await requireRole("ADMIN");
  const data = await getAdminAnalytics(prisma, user);
  return Response.json({ data });
});
