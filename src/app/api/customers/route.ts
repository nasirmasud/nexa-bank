import { prisma } from "@/lib/prisma";
import { withApi } from "@/lib/withApi";
import { requireRole } from "@/lib/guards";
import { createCustomerSchema, customerListSchema } from "@/lib/validators/customer";
import { createCustomer, listCustomers } from "@/lib/services/customerService";

export const GET = withApi(async (request) => {
  const user = await requireRole("ADMIN", "STAFF");
  const url = new URL(request.url);
  const input = customerListSchema.parse(Object.fromEntries(url.searchParams));
  const result = await listCustomers(prisma, user, input);
  return Response.json({ data: result.items, pagination: result.pagination });
});

export const POST = withApi(async (request) => {
  const user = await requireRole("ADMIN", "STAFF");
  const body = createCustomerSchema.parse(await request.json());
  const result = await createCustomer(prisma, user, body);
  return Response.json({ data: result }, { status: 201 });
});
