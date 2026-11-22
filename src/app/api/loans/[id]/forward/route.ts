import { prisma } from "@/lib/prisma";
import { withApi } from "@/lib/withApi";
import { requireRole } from "@/lib/guards";
import { loanForwardSchema } from "@/lib/validators/loan";
import { forwardLoan } from "@/lib/services/loanService";

type Ctx = { params: Promise<{ id: string }> };

export const POST = withApi(async (request, context) => {
  const user = await requireRole("ADMIN", "STAFF");
  const { id } = await (context as Ctx).params;
  const body = loanForwardSchema.parse(await request.json().catch(() => ({})));
  const loan = await forwardLoan(prisma, user, id, body.note);
  return Response.json({ data: loan });
});
