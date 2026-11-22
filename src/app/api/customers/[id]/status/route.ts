import { prisma } from "@/lib/prisma";
import { withApi } from "@/lib/withApi";
import { requireRole } from "@/lib/guards";
import { updateCustomerStatusSchema } from "@/lib/validators/customer";
import { updateCustomerStatus } from "@/lib/services/customerService";

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = withApi(async (request, context) => {
  const user = await requireRole("ADMIN");
  const { id } = await (context as Ctx).params;
  const body = updateCustomerStatusSchema.parse(await request.json());
  const customer = await updateCustomerStatus(prisma, user, id, body.status);
  return Response.json({ data: customer });
});
