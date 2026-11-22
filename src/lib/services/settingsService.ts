import { Prisma, PrismaClient, Role } from "@prisma/client";
import { AppError } from "@/lib/errors";
import { recordAuditLog } from "@/lib/audit";
import { toDecimal } from "@/lib/money";
import type { UpdateSettingsInput } from "@/lib/validators/settings";

export type SettingsActor = { id: string; role: Role };

const settingsSelect = {
  id: true,
  dailyTransferLimit: true,
  maxSingleTransaction: true,
  minAccountBalance: true,
  transferFeePercent: true,
  minTransferFee: true,
  loanIncomeMultiplier: true,
  loanInterestRates: true,
  updatedById: true,
  updatedAt: true,
} satisfies Prisma.SettingsSelect;

async function ensureSettings(db: PrismaClient) {
  const existing = await db.settings.findUnique({ where: { id: 1 }, select: settingsSelect });
  if (existing) return existing;
  return db.settings.create({
    data: {
      id: 1,
      loanInterestRates: { PERSONAL: 12, HOME: 10, AUTO: 11, EDUCATION: 8, BUSINESS: 14 },
    },
    select: settingsSelect,
  });
}

export async function getSettings(db: PrismaClient, actor: SettingsActor) {
  if (actor.role !== Role.ADMIN) throw new AppError("FORBIDDEN", "Not authorized", 403);
  return ensureSettings(db);
}

export async function updateSettings(
  db: PrismaClient,
  actor: SettingsActor,
  input: UpdateSettingsInput,
) {
  if (actor.role !== Role.ADMIN) throw new AppError("FORBIDDEN", "Not authorized", 403);
  await ensureSettings(db);

  const data: Prisma.SettingsUpdateInput = { updatedById: actor.id };
  if (input.dailyTransferLimit !== undefined)
    data.dailyTransferLimit = toDecimal(input.dailyTransferLimit).toDecimalPlaces(2);
  if (input.maxSingleTransaction !== undefined)
    data.maxSingleTransaction = toDecimal(input.maxSingleTransaction).toDecimalPlaces(2);
  if (input.minAccountBalance !== undefined)
    data.minAccountBalance = toDecimal(input.minAccountBalance).toDecimalPlaces(2);
  if (input.transferFeePercent !== undefined)
    data.transferFeePercent = toDecimal(input.transferFeePercent).toDecimalPlaces(2);
  if (input.minTransferFee !== undefined)
    data.minTransferFee = toDecimal(input.minTransferFee).toDecimalPlaces(2);

  const updated = await db.settings.update({ where: { id: 1 }, data, select: settingsSelect });
  await recordAuditLog(db, {
    actorId: actor.id,
    action: "SETTINGS_UPDATED",
    entityType: "Settings",
    entityId: "1",
    after: input as unknown as Prisma.InputJsonValue,
  });
  return updated;
}
