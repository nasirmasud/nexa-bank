import { prisma } from "@/lib/prisma";
import { withApi } from "@/lib/withApi";
import { requireRole } from "@/lib/guards";
import { loanNoteSchema } from "@/lib/validators/loan";
import { addLoanNote } from "@/lib/services/loanService";

type Ctx = { params: Promise<{ id: string }> };

export const POST = withApi(async (request, context) => {
  const user = await requireRole("ADMIN", "STAFF");
  const { id } = await (context as Ctx).params;
  const body = loanNoteSchema.parse(await request.json());
  const note = await addLoanNote(prisma, user, id, body.body, body.internal);
  return Response.json({ data: note }, { status: 201 });
});
