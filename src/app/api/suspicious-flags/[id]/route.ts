import { prisma } from "@/lib/prisma";
import { withApi } from "@/lib/withApi";
import { requireRole } from "@/lib/guards";
import { resolveFlagSchema } from "@/lib/validators/suspiciousFlag";
import { getSuspiciousFlagById, resolveSuspiciousFlag } from "@/lib/services/suspiciousFlagService";

type Ctx = { params: Promise<{ id: string }> };

export const GET = withApi(async (_request, context) => {
  const user = await requireRole("ADMIN", "STAFF");
  const { id } = await (context as Ctx).params;
  const flag = await getSuspiciousFlagById(prisma, user, id);
  return Response.json({ data: flag });
});

export const PATCH = withApi(async (request, context) => {
  const user = await requireRole("ADMIN", "STAFF");
  const { id } = await (context as Ctx).params;
  const body = resolveFlagSchema.parse(await request.json());
  const flag = await resolveSuspiciousFlag(prisma, user, id, body);
  return Response.json({ data: flag });
});
