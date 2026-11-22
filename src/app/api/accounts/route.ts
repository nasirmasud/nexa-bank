import { prisma } from "@/lib/prisma";
import { withApi } from "@/lib/withApi";
import { requireAuth, requireRole } from "@/lib/guards";
import { accountListSchema, createAccountSchema } from "@/lib/validators/account";
import { createAccount, listAccounts } from "@/lib/services/accountService";

export const GET = withApi(async (request) => {
  const user = await requireAuth();
  const url = new URL(request.url);
  const input = accountListSchema.parse(Object.fromEntries(url.searchParams));
  const result = await listAccounts(prisma, user, input);
  return Response.json({ data: result.items, pagination: result.pagination });
});

export const POST = withApi(async (request) => {
  const user = await requireRole("ADMIN", "STAFF");
  const body = createAccountSchema.parse(await request.json());
  const account = await createAccount(prisma, user, body);
  return Response.json({ data: account }, { status: 201 });
});
