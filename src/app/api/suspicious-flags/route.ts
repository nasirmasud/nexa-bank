import { prisma } from "@/lib/prisma";
import { withApi } from "@/lib/withApi";
import { requireRole } from "@/lib/guards";
import { suspiciousFlagListSchema } from "@/lib/validators/suspiciousFlag";
import { listSuspiciousFlags } from "@/lib/services/suspiciousFlagService";

export const GET = withApi(async (request) => {
  const user = await requireRole("ADMIN", "STAFF");
  const url = new URL(request.url);
  const input = suspiciousFlagListSchema.parse(Object.fromEntries(url.searchParams));
  const result = await listSuspiciousFlags(prisma, user, input);
  return Response.json({ data: result.items, pagination: result.pagination });
});
