import { prisma } from "@/lib/prisma";
import { withApi } from "@/lib/withApi";
import { requireRole } from "@/lib/guards";
import { AppError } from "@/lib/errors";
import { buildPaginationMeta, paginationToSkipTake } from "@/lib/pagination";
import { paginationSchema } from "@/lib/validators/common";

type Ctx = { params: Promise<{ id: string }> };

export const GET = withApi(async (request, context) => {
  await requireRole("ADMIN", "STAFF");
  const { id } = await (context as Ctx).params;
  const url = new URL(request.url);
  const { page, pageSize } = paginationSchema.parse(Object.fromEntries(url.searchParams));

  const customer = await prisma.user.findFirst({
    where: { id, role: "CUSTOMER" },
    select: { id: true },
  });
  if (!customer) throw new AppError("NOT_FOUND", "Customer not found", 404);

  const where = { OR: [{ fromAccount: { ownerId: id } }, { toAccount: { ownerId: id } }] };
  const { skip, take } = paginationToSkipTake(page, pageSize);
  const [total, items] = await Promise.all([
    prisma.transaction.count({ where }),
    prisma.transaction.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        reference: true,
        type: true,
        status: true,
        amount: true,
        fee: true,
        currency: true,
        createdAt: true,
        fromAccount: { select: { accountNumber: true } },
        toAccount: { select: { accountNumber: true } },
      },
    }),
  ]);

  return Response.json({ data: items, pagination: buildPaginationMeta(page, pageSize, total) });
});
