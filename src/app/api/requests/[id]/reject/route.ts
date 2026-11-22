import { prisma } from "@/lib/prisma";
import { withApi } from "@/lib/withApi";
import { requireRole } from "@/lib/guards";
import { rejectRequestSchema } from "@/lib/validators/request";
import { rejectRequest } from "@/lib/services/requestService";

type Ctx = { params: Promise<{ id: string }> };

export const POST = withApi(async (request, context) => {
  const user = await requireRole("ADMIN", "STAFF");
  const { id } = await (context as Ctx).params;
  const { reason } = rejectRequestSchema.parse(await request.json());
  const req = await rejectRequest(prisma, user, id, reason);
  return Response.json({ data: req });
});
