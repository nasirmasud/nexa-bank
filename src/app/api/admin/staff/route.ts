import { prisma } from "@/lib/prisma";
import { withApi } from "@/lib/withApi";
import { requireRole } from "@/lib/guards";
import { createStaffSchema, staffListSchema } from "@/lib/validators/staff";
import { createStaff, listStaff } from "@/lib/services/staffService";

export const GET = withApi(async (request) => {
  const user = await requireRole("ADMIN");
  const url = new URL(request.url);
  const input = staffListSchema.parse(Object.fromEntries(url.searchParams));
  const result = await listStaff(prisma, user, input);
  return Response.json({ data: result.items, pagination: result.pagination });
});

export const POST = withApi(async (request) => {
  const user = await requireRole("ADMIN");
  const body = createStaffSchema.parse(await request.json());
  const result = await createStaff(prisma, user, body);
  return Response.json({ data: result }, { status: 201 });
});
