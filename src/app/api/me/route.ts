import { prisma } from "@/lib/prisma";
import { withApi } from "@/lib/withApi";
import { requireAuth } from "@/lib/guards";
import { updateProfileSchema } from "@/lib/validators/profile";
import { getMyProfile, updateMyProfile } from "@/lib/services/profileService";

export const GET = withApi(async () => {
  const user = await requireAuth({ allowPasswordChangeRequired: true });
  const profile = await getMyProfile(prisma, user);
  return Response.json({ data: profile });
});

export const PATCH = withApi(async (request) => {
  const user = await requireAuth();
  const body = updateProfileSchema.parse(await request.json());
  const profile = await updateMyProfile(prisma, user, body);
  return Response.json({ data: profile });
});
