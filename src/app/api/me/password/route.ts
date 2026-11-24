import { prisma } from "@/lib/prisma";
import { withApi } from "@/lib/withApi";
import { requireAuth } from "@/lib/guards";
import { changePasswordSchema } from "@/lib/validators/profile";
import { changeMyPassword } from "@/lib/services/profileService";

export const POST = withApi(async (request) => {
  const user = await requireAuth({ allowPasswordChangeRequired: true });
  const body = changePasswordSchema.parse(await request.json());
  const result = await changeMyPassword(prisma, user, body);
  return Response.json({ data: result });
});
