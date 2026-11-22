import { prisma } from "@/lib/prisma";
import { withApi } from "@/lib/withApi";
import { requireRole } from "@/lib/guards";
import { flagTransactionSchema } from "@/lib/validators/transaction";
import { flagTransaction } from "@/lib/services/transactionService";

type Ctx = { params: Promise<{ id: string }> };

export const POST = withApi(async (request, context) => {
  const user = await requireRole("ADMIN", "STAFF");
  const { id } = await (context as Ctx).params;
  const body = flagTransactionSchema.parse(await request.json());
  const flag = await flagTransaction(prisma, user, id, body.reason);
  return Response.json({ data: flag }, { status: 201 });
});
