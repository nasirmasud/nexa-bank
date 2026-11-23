import { prisma } from "@/lib/prisma";
import { withApi } from "@/lib/withApi";
import { requireRole } from "@/lib/guards";
import { loanRejectSchema } from "@/lib/validators/loan";
import { rejectLoan } from "@/lib/services/loanService";

type Ctx = { params: Promise<{ id: string }> };

export const POST = withApi(async (request, context) => {
  const user = await requireRole("ADMIN");
  const { id } = await (context as Ctx).params;
  const body = loanRejectSchema.parse(await request.json());
  const loan = await rejectLoan(prisma, user, id, body.reason);
  return Response.json({ data: loan });
});
