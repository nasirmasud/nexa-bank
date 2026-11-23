import { prisma } from "@/lib/prisma";
import { withApi } from "@/lib/withApi";
import { requireRole } from "@/lib/guards";
import { loanApproveSchema } from "@/lib/validators/loan";
import { approveLoan } from "@/lib/services/loanService";

type Ctx = { params: Promise<{ id: string }> };

export const POST = withApi(async (request, context) => {
  const user = await requireRole("ADMIN");
  const { id } = await (context as Ctx).params;
  const body = loanApproveSchema.parse(await request.json());
  const result = await approveLoan(prisma, user, id, body);
  return Response.json({ data: result });
});
