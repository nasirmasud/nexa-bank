import { prisma } from "@/lib/prisma";
import { withApi } from "@/lib/withApi";
import { requireRole } from "@/lib/guards";
import { accountLimitsSchema } from "@/lib/validators/account";
import { updateAccountLimits } from "@/lib/services/accountService";

type Ctx = { params: Promise<{ id: string }> };

export const PUT = withApi(async (request, context) => {
  const user = await requireRole("ADMIN", "STAFF");
  const { id } = await (context as Ctx).params;
  const body = accountLimitsSchema.parse(await request.json());
  const account = await updateAccountLimits(prisma, user, id, body);
  return Response.json({ data: account });
});
