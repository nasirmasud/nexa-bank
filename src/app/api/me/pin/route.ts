import { prisma } from "@/lib/prisma";
import { withApi } from "@/lib/withApi";
import { requireAuth } from "@/lib/guards";
import { setPinSchema } from "@/lib/validators/profile";
import { setMyPin } from "@/lib/services/profileService";

export const POST = withApi(async (request) => {
  const user = await requireAuth();
  const body = setPinSchema.parse(await request.json());
  const result = await setMyPin(prisma, user, body);
  return Response.json({ data: result });
});
