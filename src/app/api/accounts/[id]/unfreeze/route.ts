import { prisma } from "@/lib/prisma";
import { withApi } from "@/lib/withApi";
import { requireRole } from "@/lib/guards";
import { unfreezeAccount } from "@/lib/services/accountService";

type Ctx = { params: Promise<{ id: string }> };

export const POST = withApi(async (_request, context) => {
  const user = await requireRole("ADMIN");
  const { id } = await (context as Ctx).params;
  const account = await unfreezeAccount(prisma, user, id);
  return Response.json({ data: account });
});
