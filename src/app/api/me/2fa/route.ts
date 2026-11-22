import { prisma } from "@/lib/prisma";
import { withApi } from "@/lib/withApi";
import { requireAuth } from "@/lib/guards";
import { toggle2faSchema } from "@/lib/validators/profile";
import { toggleMy2fa } from "@/lib/services/profileService";

export const POST = withApi(async (request) => {
  const user = await requireAuth();
  const body = toggle2faSchema.parse(await request.json());
  const result = await toggleMy2fa(prisma, user, body.enabled);
  return Response.json({ data: result });
});
