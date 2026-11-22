import { prisma } from "@/lib/prisma";
import { withApi } from "@/lib/withApi";
import { requireAuth, requireRole } from "@/lib/guards";
import { applyLoanSchema, loanListSchema } from "@/lib/validators/loan";
import { applyLoan, listLoans } from "@/lib/services/loanService";

export const GET = withApi(async (request) => {
  const user = await requireAuth();
  const url = new URL(request.url);
  const input = loanListSchema.parse(Object.fromEntries(url.searchParams));
  const result = await listLoans(prisma, user, input);
  return Response.json({ data: result.items, pagination: result.pagination });
});

export const POST = withApi(async (request) => {
  const user = await requireRole("CUSTOMER");
  const body = applyLoanSchema.parse(await request.json());
  const loan = await applyLoan(prisma, user, body);
  return Response.json({ data: loan }, { status: 201 });
});
