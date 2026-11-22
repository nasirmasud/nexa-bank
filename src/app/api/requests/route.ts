import { prisma } from "@/lib/prisma";
import { withApi } from "@/lib/withApi";
import { requireAuth, requireRole } from "@/lib/guards";
import { createRequestSchema, requestListSchema } from "@/lib/validators/request";
import { createRequest, listRequests } from "@/lib/services/requestService";

export const GET = withApi(async (request) => {
  const user = await requireAuth();
  const url = new URL(request.url);
  const input = requestListSchema.parse(Object.fromEntries(url.searchParams));
  const result = await listRequests(prisma, user, input);
  return Response.json({ data: result.items, pagination: result.pagination });
});

export const POST = withApi(async (request) => {
  const user = await requireRole("CUSTOMER");
  const body = createRequestSchema.parse(await request.json());
  const req = await createRequest(prisma, user, body);
  return Response.json({ data: req }, { status: 201 });
});
