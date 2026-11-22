import { prisma } from "@/lib/prisma";
import { withApi } from "@/lib/withApi";
import { requireRole } from "@/lib/guards";
import { updateKycSchema } from "@/lib/validators/customer";
import { updateCustomerKyc } from "@/lib/services/customerService";

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = withApi(async (request, context) => {
  const user = await requireRole("ADMIN", "STAFF");
  const { id } = await (context as Ctx).params;
  const body = updateKycSchema.parse(await request.json());
  const customer = await updateCustomerKyc(prisma, user, id, body.kycStatus);
  return Response.json({ data: customer });
});
