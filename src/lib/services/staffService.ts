import bcrypt from "bcryptjs";
import { Prisma, PrismaClient, Role, UserStatus } from "@prisma/client";
import { AppError } from "@/lib/errors";
import { recordAuditLog } from "@/lib/audit";
import { buildPaginationMeta, paginationToSkipTake } from "@/lib/pagination";
import type { CreateStaffInput, StaffListInput } from "@/lib/validators/staff";

export type StaffActor = { id: string; role: Role };

const staffSelect = {
  id: true,
  email: true,
  name: true,
  phone: true,
  role: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

export async function createStaff(db: PrismaClient, actor: StaffActor, input: CreateStaffInput) {
  if (actor.role !== Role.ADMIN) throw new AppError("FORBIDDEN", "Not authorized", 403);

  const passwordHash = await bcrypt.hash(input.temporaryPassword, 12);

  try {
    const user = await db.user.create({
      data: {
        email: input.email.toLowerCase(),
        passwordHash,
        name: input.name,
        phone: input.phone ?? null,
        role: Role.STAFF,
        status: UserStatus.ACTIVE,
        createdById: actor.id,
      },
      select: staffSelect,
    });

    await recordAuditLog(db, {
      actorId: actor.id,
      action: "STAFF_CREATED",
      entityType: "User",
      entityId: user.id,
      after: { email: user.email, name: user.name, role: user.role, status: user.status },
    });

    return { staff: user };
  } catch (err) {
    if ((err as { code?: string }).code === "P2002") {
      throw new AppError("VALIDATION_ERROR", "Email already exists", 422);
    }
    throw err;
  }
}

export async function listStaff(db: PrismaClient, actor: StaffActor, input: StaffListInput) {
  if (actor.role !== Role.ADMIN) throw new AppError("FORBIDDEN", "Not authorized", 403);

  const where: Prisma.UserWhereInput = { role: Role.STAFF };
  if (input.q) {
    where.OR = [
      { name: { contains: input.q, mode: "insensitive" } },
      { email: { contains: input.q, mode: "insensitive" } },
      { phone: { contains: input.q, mode: "insensitive" } },
    ];
  }

  const { skip, take } = paginationToSkipTake(input.page, input.pageSize);
  const [total, items] = await Promise.all([
    db.user.count({ where }),
    db.user.findMany({ where, skip, take, orderBy: { createdAt: "desc" }, select: staffSelect }),
  ]);

  return { items, pagination: buildPaginationMeta(input.page, input.pageSize, total) };
}

export async function updateStaffStatus(
  db: PrismaClient,
  actor: StaffActor,
  id: string,
  status: UserStatus.ACTIVE | UserStatus.INACTIVE,
  options?: { occurredAt?: Date },
) {
  if (actor.role !== Role.ADMIN) throw new AppError("FORBIDDEN", "Not authorized", 403);
  if (actor.id === id) throw new AppError("FORBIDDEN", "You cannot change your own staff status", 403);

  const existing = await db.user.findFirst({
    where: { id, role: Role.STAFF },
    select: { id: true, status: true, email: true, name: true, role: true },
  });
  if (!existing) throw new AppError("NOT_FOUND", "Staff user not found", 404);

  const updated = await db.user.update({
    where: { id },
    data: {
      status,
      ...(status !== UserStatus.ACTIVE ? { sessionVersion: { increment: 1 } } : {}),
    },
    select: staffSelect,
  });

  await recordAuditLog(db, {
    actorId: actor.id,
    action: status === UserStatus.ACTIVE ? "STAFF_ACTIVATED" : "STAFF_DEACTIVATED",
    entityType: "User",
    entityId: id,
    before: { status: existing.status },
    after: { status },
    occurredAt: options?.occurredAt,
  });

  return updated;
}
