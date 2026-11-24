import bcrypt from "bcryptjs";
import { PrismaClient, Role } from "@prisma/client";
import { AppError } from "@/lib/errors";
import { recordAuditLog } from "@/lib/audit";
import type {
  ChangePasswordInput,
  SetPinInput,
  UpdateProfileInput,
} from "@/lib/validators/profile";

export type ProfileActor = { id: string; role: Role };

const profileSelect = {
  id: true,
  email: true,
  name: true,
  phone: true,
  role: true,
  status: true,
  twoFactorEnabled: true,
  theme: true,
  pinHash: true,
  createdAt: true,
  updatedAt: true,
  profile: {
    select: {
      customerNo: true,
      nid: true,
      kycStatus: true,
      dateOfBirth: true,
      presentAddress: true,
      occupation: true,
    },
  },
} as const;

function toSafeProfile<T extends { pinHash?: string | null }>(user: T) {
  const { pinHash, ...rest } = user;
  return { ...rest, hasPin: Boolean(pinHash) };
}

export async function getMyProfile(db: PrismaClient, actor: ProfileActor) {
  const user = await db.user.findUnique({ where: { id: actor.id }, select: profileSelect });
  if (!user) throw new AppError("NOT_FOUND", "User not found", 404);
  return toSafeProfile(user);
}

export async function updateMyProfile(
  db: PrismaClient,
  actor: ProfileActor,
  input: UpdateProfileInput,
) {
  const user = await db.user.update({
    where: { id: actor.id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
    },
    select: profileSelect,
  });
  return toSafeProfile(user);
}

export async function changeMyPassword(
  db: PrismaClient,
  actor: ProfileActor,
  input: ChangePasswordInput,
) {
  const user = await db.user.findUnique({
    where: { id: actor.id },
    select: { id: true, passwordHash: true, mustChangePassword: true },
  });
  if (!user) throw new AppError("NOT_FOUND", "User not found", 404);

  const ok = await bcrypt.compare(input.currentPassword, user.passwordHash);
  if (!ok) throw new AppError("INVALID_PASSWORD", "Current password is incorrect", 400);

  const sameAsCurrent = await bcrypt.compare(input.newPassword, user.passwordHash);
  if (sameAsCurrent) {
    throw new AppError(
      "VALIDATION_ERROR",
      "New password must be different from your current password",
      400,
    );
  }

  const passwordHash = await bcrypt.hash(input.newPassword, 12);
  await db.user.update({
    where: { id: actor.id },
    data: { passwordHash, sessionVersion: { increment: 1 }, mustChangePassword: false },
  });
  await recordAuditLog(db, {
    actorId: actor.id,
    action: "PASSWORD_CHANGED",
    entityType: "User",
    entityId: actor.id,
    before: { mustChangePassword: user.mustChangePassword },
    after: { mustChangePassword: false },
  });
  return { ok: true };
}

export async function setMyPin(db: PrismaClient, actor: ProfileActor, input: SetPinInput) {
  const user = await db.user.findUnique({
    where: { id: actor.id },
    select: { id: true, pinHash: true },
  });
  if (!user) throw new AppError("NOT_FOUND", "User not found", 404);

  if (user.pinHash) {
    if (!input.currentPin) throw new AppError("INVALID_PIN", "Current PIN is required", 400);
    const ok = await bcrypt.compare(input.currentPin, user.pinHash);
    if (!ok) throw new AppError("INVALID_PIN", "Current PIN is incorrect", 400);
  }

  const pinHash = await bcrypt.hash(input.newPin, 12);
  await db.user.update({
    where: { id: actor.id },
    data: { pinHash, pinFailedCount: 0, pinLockedUntil: null },
  });
  return { ok: true, hasPin: true };
}

export async function toggleMy2fa(db: PrismaClient, actor: ProfileActor, enabled: boolean) {
  const user = await db.user.update({
    where: { id: actor.id },
    data: { twoFactorEnabled: enabled },
    select: { twoFactorEnabled: true },
  });
  return user;
}

export async function updateMyTheme(
  db: PrismaClient,
  actor: ProfileActor,
  theme: "light" | "dark" | "system",
) {
  const user = await db.user.update({
    where: { id: actor.id },
    data: { theme },
    select: { theme: true },
  });
  return user;
}
