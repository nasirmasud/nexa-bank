import { prisma } from "@/lib/prisma";
import { withApi } from "@/lib/withApi";
import { requireAuth } from "@/lib/guards";
import { getRequestById } from "@/lib/services/requestService";

type Ctx = { params: Promise<{ id: string }> };

export const GET = withApi(async (_request, context) => {
  const user = await requireAuth();
  const { id } = await (context as Ctx).params;
  const req = await getRequestById(prisma, user, id);
  return Response.json({ data: req });
});
