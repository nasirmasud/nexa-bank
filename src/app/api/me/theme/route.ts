import { prisma } from "@/lib/prisma";
import { withApi } from "@/lib/withApi";
import { requireAuth } from "@/lib/guards";
import { updateThemeSchema } from "@/lib/validators/profile";
import { updateMyTheme } from "@/lib/services/profileService";

export const PATCH = withApi(async (request) => {
  const user = await requireAuth();
  const body = updateThemeSchema.parse(await request.json());
  const result = await updateMyTheme(prisma, user, body.theme);
  return Response.json({ data: result });
});
