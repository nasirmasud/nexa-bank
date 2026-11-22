import { prisma } from "@/lib/prisma";
import { withApi } from "@/lib/withApi";
import { requireRole } from "@/lib/guards";
import { createTransferSchema } from "@/lib/validators/transfer";
import { transfer } from "@/lib/services/transferService";

export const POST = withApi(async (request) => {
  const user = await requireRole("CUSTOMER");
  const body = createTransferSchema.parse(await request.json());
  const result = await transfer(prisma, user, body);
  return Response.json({ data: result }, { status: 201 });
});
