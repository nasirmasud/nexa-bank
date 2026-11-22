import { prisma } from "@/lib/prisma";
import { withApi } from "@/lib/withApi";
import { requireRole } from "@/lib/guards";
import { auditLogListSchema } from "@/lib/validators/auditLog";
import { listAuditLogs } from "@/lib/services/auditLogService";

export const GET = withApi(async (request) => {
  const user = await requireRole("ADMIN");
  const url = new URL(request.url);
  const input = auditLogListSchema.parse(Object.fromEntries(url.searchParams));
  const result = await listAuditLogs(prisma, user, input);
  return Response.json({ data: result.items, pagination: result.pagination });
});
