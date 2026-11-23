import { Prisma, PrismaClient } from "@prisma/client";

type Db = PrismaClient | Prisma.TransactionClient;

export async function recordAuditLog(
  db: Db,
  data: {
    actorId?: string | null;
    action: string;
    entityType: string;
    entityId?: string | null;
    before?: Prisma.InputJsonValue;
    after?: Prisma.InputJsonValue;
    ip?: string | null;
    occurredAt?: Date;
  },
) {
  return db.auditLog.create({
    data: {
      actorId: data.actorId ?? null,
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId ?? null,
      before: data.before,
      after: data.after,
      ip: data.ip ?? null,
      ...(data.occurredAt ? { createdAt: data.occurredAt } : {}),
    },
  });
}
