import { prisma } from "@/lib/prisma";
import { withApi } from "@/lib/withApi";
import { requireRole } from "@/lib/guards";
import { approveRequest } from "@/lib/services/requestService";

type Ctx = { params: Promise<{ id: string }> };

export const POST = withApi(async (_request, context) => {
  const user = await requireRole("ADMIN", "STAFF");
  const { id } = await (context as Ctx).params;
  const req = await approveRequest(prisma, user, id);
  return Response.json({ data: req });
});
