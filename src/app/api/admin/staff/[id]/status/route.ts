import { prisma } from "@/lib/prisma";
import { withApi } from "@/lib/withApi";
import { requireRole } from "@/lib/guards";
import { updateStaffStatusSchema } from "@/lib/validators/staff";
import { updateStaffStatus } from "@/lib/services/staffService";

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = withApi(async (request, context) => {
  const user = await requireRole("ADMIN");
  const { id } = await (context as Ctx).params;
  const body = updateStaffStatusSchema.parse(await request.json());
  const staff = await updateStaffStatus(prisma, user, id, body.status);
  return Response.json({ data: staff });
});