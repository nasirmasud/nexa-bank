import { prisma } from "@/lib/prisma";
import { withApi } from "@/lib/withApi";
import { requireRole } from "@/lib/guards";
import { payLoanInstallment } from "@/lib/services/loanService";

type Ctx = { params: Promise<{ id: string; installmentId: string }> };

export const POST = withApi(async (_request, context) => {
  const user = await requireRole("CUSTOMER");
  const { id, installmentId } = await (context as Ctx).params;
  const result = await payLoanInstallment(prisma, user, id, installmentId);
  return Response.json({ data: result });
});
