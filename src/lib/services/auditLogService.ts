import { Prisma, PrismaClient, Role } from "@prisma/client";
import { AppError } from "@/lib/errors";
import { buildPaginationMeta, paginationToSkipTake } from "@/lib/pagination";
import type { AuditLogListInput } from "@/lib/validators/auditLog";

export type AuditActor = { id: string; role: Role };

export async function listAuditLogs(db: PrismaClient, actor: AuditActor, input: AuditLogListInput) {
  if (actor.role !== Role.ADMIN) throw new AppError("FORBIDDEN", "Not authorized", 403);
  const where: Prisma.AuditLogWhereInput = {};
  if (input.action) where.action = { contains: input.action, mode: "insensitive" };
  if (input.entityType) where.entityType = { contains: input.entityType, mode: "insensitive" };

  const { skip, take } = paginationToSkipTake(input.page, input.pageSize);
  const [total, items] = await Promise.all([
    db.auditLog.count({ where }),
    db.auditLog.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        actorId: true,
        action: true,
        entityType: true,
        entityId: true,
        ip: true,
        createdAt: true,
        actor: { select: { id: true, name: true, email: true } },
      },
    }),
  ]);
  return { items, pagination: buildPaginationMeta(input.page, input.pageSize, total) };
}
