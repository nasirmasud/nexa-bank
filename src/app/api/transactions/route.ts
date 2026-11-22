import { prisma } from "@/lib/prisma";
import { withApi } from "@/lib/withApi";
import { requireAuth } from "@/lib/guards";
import { transactionListSchema } from "@/lib/validators/transaction";
import { listTransactions } from "@/lib/services/transactionService";

export const GET = withApi(async (request) => {
  const user = await requireAuth();
  const url = new URL(request.url);
  const input = transactionListSchema.parse(Object.fromEntries(url.searchParams));
  const result = await listTransactions(prisma, user, input);
  return Response.json({ data: result.items, pagination: result.pagination });
});
