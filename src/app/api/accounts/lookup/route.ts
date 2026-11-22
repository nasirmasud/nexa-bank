import { prisma } from "@/lib/prisma";
import { withApi } from "@/lib/withApi";
import { requireAuth } from "@/lib/guards";
import { accountLookupSchema } from "@/lib/validators/account";
import { lookupAccountByNumber } from "@/lib/services/accountService";

export const GET = withApi(async (request) => {
  const user = await requireAuth();
  const url = new URL(request.url);
  const { number } = accountLookupSchema.parse({ number: url.searchParams.get("number") });
  const account = await lookupAccountByNumber(prisma, user, number);
  return Response.json({ data: account });
});
