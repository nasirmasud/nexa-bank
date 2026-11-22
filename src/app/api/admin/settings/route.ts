import { prisma } from "@/lib/prisma";
import { withApi } from "@/lib/withApi";
import { requireRole } from "@/lib/guards";
import { updateSettingsSchema } from "@/lib/validators/settings";
import { getSettings, updateSettings } from "@/lib/services/settingsService";

export const GET = withApi(async () => {
  const user = await requireRole("ADMIN");
  const settings = await getSettings(prisma, user);
  return Response.json({ data: settings });
});

export const PATCH = withApi(async (request) => {
  const user = await requireRole("ADMIN");
  const body = updateSettingsSchema.parse(await request.json());
  const settings = await updateSettings(prisma, user, body);
  return Response.json({ data: settings });
});
