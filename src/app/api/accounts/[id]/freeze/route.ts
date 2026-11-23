import { prisma } from "@/lib/prisma";
import { withApi } from "@/lib/withApi";
import { requireRole } from "@/lib/guards";
import { freezeAccountSchema } from "@/lib/validators/account";
import { freezeAccount } from "@/lib/services/accountService";

type Ctx = { params: Promise<{ id: string }> };

export const POST = withApi(async (request, context) => {
  const user = await requireRole("ADMIN");
  const { id } = await (context as Ctx).params;
  const { reason } = freezeAccountSchema.parse(await request.json());
  const account = await freezeAccount(prisma, user, id, reason);
  return Response.json({ data: account });
});
