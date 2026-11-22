import { FlagStatus, Prisma, PrismaClient, Role } from "@prisma/client";
import { AppError } from "@/lib/errors";
import { recordAuditLog } from "@/lib/audit";
import { buildPaginationMeta, paginationToSkipTake } from "@/lib/pagination";
import type { ResolveFlagInput, SuspiciousFlagListInput } from "@/lib/validators/suspiciousFlag";

export type FlagActor = { id: string; role: Role };

const flagSelect = {
  id: true,
  transactionId: true,
  source: true,
  ruleCode: true,
  reason: true,
  status: true,
  raisedById: true,
  resolvedById: true,
  resolutionNote: true,
  createdAt: true,
  resolvedAt: true,
  transaction: {
    select: {
      id: true,
      reference: true,
      type: true,
      status: true,
      amount: true,
      currency: true,
      createdAt: true,
    },
  },
  raisedBy: { select: { id: true, name: true, role: true } },
  resolvedBy: { select: { id: true, name: true, role: true } },
} satisfies Prisma.SuspiciousFlagSelect;

export async function listSuspiciousFlags(
  db: PrismaClient,
  actor: FlagActor,
  input: SuspiciousFlagListInput,
) {
  if (actor.role === Role.CUSTOMER) throw new AppError("FORBIDDEN", "Not authorized", 403);
  const where: Prisma.SuspiciousFlagWhereInput = {};
  if (input.status) where.status = input.status;
  const { skip, take } = paginationToSkipTake(input.page, input.pageSize);
  const [total, items] = await Promise.all([
    db.suspiciousFlag.count({ where }),
    db.suspiciousFlag.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      select: flagSelect,
    }),
  ]);
  return { items, pagination: buildPaginationMeta(input.page, input.pageSize, total) };
}

export async function getSuspiciousFlagById(db: PrismaClient, actor: FlagActor, id: string) {
  if (actor.role === Role.CUSTOMER) throw new AppError("FORBIDDEN", "Not authorized", 403);
  const flag = await db.suspiciousFlag.findUnique({ where: { id }, select: flagSelect });
  if (!flag) throw new AppError("NOT_FOUND", "Suspicious flag not found", 404);
  return flag;
}

export async function resolveSuspiciousFlag(
  db: PrismaClient,
  actor: FlagActor,
  id: string,
  input: ResolveFlagInput,
) {
  if (actor.role === Role.CUSTOMER) throw new AppError("FORBIDDEN", "Not authorized", 403);
  const existing = await db.suspiciousFlag.findUnique({
    where: { id },
    select: { id: true, status: true },
  });
  if (!existing) throw new AppError("NOT_FOUND", "Suspicious flag not found", 404);
  if (existing.status !== FlagStatus.OPEN) {
    throw new AppError("VALIDATION_ERROR", "Only open flags can be resolved", 422);
  }

  const updated = await db.suspiciousFlag.update({
    where: { id },
    data: {
      status: input.status,
      resolutionNote: input.resolutionNote,
      resolvedById: actor.id,
      resolvedAt: new Date(),
    },
    select: flagSelect,
  });
  await recordAuditLog(db, {
    actorId: actor.id,
    action: "SUSPICIOUS_FLAG_RESOLVED",
    entityType: "SuspiciousFlag",
    entityId: id,
    before: { status: existing.status },
    after: { status: input.status, resolutionNote: input.resolutionNote },
  });
  return updated;
}
