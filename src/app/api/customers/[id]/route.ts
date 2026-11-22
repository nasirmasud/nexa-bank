import { prisma } from "@/lib/prisma";
import { withApi } from "@/lib/withApi";
import { requireRole } from "@/lib/guards";
import { getCustomerById } from "@/lib/services/customerService";

type Ctx = { params: Promise<{ id: string }> };

export const GET = withApi(async (_request, context) => {
  const user = await requireRole("ADMIN", "STAFF");
  const { id } = await (context as Ctx).params;
  const customer = await getCustomerById(prisma, user, id);
  return Response.json({ data: customer });
});
