import { prisma } from "@/lib/prisma";
import { withApi } from "@/lib/withApi";
import { requireRole } from "@/lib/guards";
import { reverseTransaction } from "@/lib/services/transactionService";

type Ctx = { params: Promise<{ id: string }> };

export const POST = withApi(async (_request, context) => {
  const user = await requireRole("ADMIN");
  const { id } = await (context as Ctx).params;
  const tx = await reverseTransaction(prisma, user, id);
  return Response.json({ data: tx });
});
