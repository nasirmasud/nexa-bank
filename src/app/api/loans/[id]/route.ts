import { prisma } from "@/lib/prisma";
import { withApi } from "@/lib/withApi";
import { requireAuth } from "@/lib/guards";
import { getLoanById } from "@/lib/services/loanService";

type Ctx = { params: Promise<{ id: string }> };

export const GET = withApi(async (_request, context) => {
  const user = await requireAuth();
  const { id } = await (context as Ctx).params;
  const loan = await getLoanById(prisma, user, id);
  return Response.json({ data: loan });
});
