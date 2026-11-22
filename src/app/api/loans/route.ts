import { prisma } from "@/lib/prisma";
import { withApi } from "@/lib/withApi";
import { requireAuth } from "@/lib/guards";
import { loanListSchema } from "@/lib/validators/loan";
import { listLoans } from "@/lib/services/loanService";

export const GET = withApi(async (request) => {
  const user = await requireAuth();
  const url = new URL(request.url);
  const input = loanListSchema.parse(Object.fromEntries(url.searchParams));
  const result = await listLoans(prisma, user, input);
  return Response.json({ data: result.items, pagination: result.pagination });
});
