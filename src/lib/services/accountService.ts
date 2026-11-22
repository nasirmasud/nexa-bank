import { AccountStatus, Prisma, PrismaClient, Role } from "@prisma/client";
import { AppError } from "@/lib/errors";
import { recordAuditLog } from "@/lib/audit";
import { generateAccountNumber } from "@/lib/ids";
import { toDecimal } from "@/lib/money";
import { buildPaginationMeta, paginationToSkipTake } from "@/lib/pagination";
import type {
  AccountListInput,
  AccountStatementInput,
  CreateAccountInput,
} from "@/lib/validators/account";

type Db = PrismaClient | Prisma.TransactionClient;

export type AccountActor = { id: string; role: Role };

const safeAccountSelect = {
  id: true,
  accountNumber: true,
  ownerId: true,
  type: true,
  status: true,
  currency: true,
  balance: true,
  dailyTransferLimit: true,
  perTxLimit: true,
  minBalance: true,
  nickname: true,
  freezeReason: true,
  openedAt: true,
  updatedAt: true,
  owner: { select: { id: true, name: true, email: true } },
} satisfies Prisma.AccountSelect;

function decimalOrNull(value: string | null | undefined) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return toDecimal(value).toDecimalPlaces(2);
}

async function generateUniqueAccountNumber(db: Db) {
  for (let i = 0; i < 10; i++) {
    const accountNumber = generateAccountNumber();
    const existing = await db.account.findUnique({
      where: { accountNumber },
      select: { id: true },
    });
    if (!existing) return accountNumber;
  }
  throw new AppError("INTERNAL_ERROR", "Failed to generate unique account number", 500);
}

export async function createAccount(
  db: PrismaClient,
  actor: AccountActor,
  input: CreateAccountInput,
) {
  if (actor.role === "CUSTOMER") throw new AppError("FORBIDDEN", "Not authorized", 403);

  const owner = await db.user.findUnique({
    where: { id: input.ownerId },
    select: { id: true, role: true, status: true },
  });
  if (!owner || owner.status !== "ACTIVE") {
    throw new AppError("NOT_FOUND", "Owner not found", 404);
  }
  if (owner.role !== Role.CUSTOMER) {
    throw new AppError("VALIDATION_ERROR", "Owner must be a customer", 422);
  }

  const accountNumber = await generateUniqueAccountNumber(db);

  const account = await db.account.create({
    data: {
      accountNumber,
      ownerId: input.ownerId,
      type: input.type,
      nickname: input.nickname,
      dailyTransferLimit: decimalOrNull(input.dailyTransferLimit),
      perTxLimit: decimalOrNull(input.perTxLimit),
      minBalance: decimalOrNull(input.minBalance),
      createdById: actor.id,
    },
    select: safeAccountSelect,
  });
  await recordAuditLog(db, {
    actorId: actor.id,
    action: "ACCOUNT_CREATED",
    entityType: "Account",
    entityId: account.id,
    after: { ownerId: account.ownerId, type: account.type, accountNumber: account.accountNumber },
  });
  return account;
}

export async function listAccounts(db: PrismaClient, actor: AccountActor, input: AccountListInput) {
  const where: Prisma.AccountWhereInput = {};

  if (actor.role === Role.CUSTOMER) {
    where.ownerId = actor.id;
  } else if (input.ownerId) {
    where.ownerId = input.ownerId;
  }

  if (input.status) where.status = input.status;
  if (input.type) where.type = input.type;
  if (input.q) {
    where.OR = [
      { accountNumber: { contains: input.q } },
      { nickname: { contains: input.q, mode: "insensitive" } },
      { owner: { name: { contains: input.q, mode: "insensitive" } } },
      { owner: { email: { contains: input.q, mode: "insensitive" } } },
    ];
  }

  const { skip, take } = paginationToSkipTake(input.page, input.pageSize);
  const [total, items] = await Promise.all([
    db.account.count({ where }),
    db.account.findMany({
      where,
      skip,
      take,
      orderBy: { openedAt: "desc" },
      select: safeAccountSelect,
    }),
  ]);

  return { items, pagination: buildPaginationMeta(input.page, input.pageSize, total) };
}

export async function getAccountById(db: PrismaClient, actor: AccountActor, accountId: string) {
  const account = await db.account.findUnique({
    where: { id: accountId },
    select: safeAccountSelect,
  });
  if (!account) throw new AppError("NOT_FOUND", "Account not found", 404);
  if (actor.role === Role.CUSTOMER && account.ownerId !== actor.id) {
    throw new AppError("NOT_FOUND", "Account not found", 404);
  }
  return account;
}

export async function lookupAccountByNumber(
  db: PrismaClient,
  actor: AccountActor,
  accountNumber: string,
) {
  const account = await db.account.findUnique({
    where: { accountNumber },
    select: {
      id: true,
      accountNumber: true,
      type: true,
      status: true,
      currency: true,
      owner: { select: { name: true } },
    },
  });
  if (!account) throw new AppError("RECIPIENT_NOT_FOUND", "Recipient account not found", 404);
  if (account.status !== AccountStatus.ACTIVE) {
    throw new AppError("ACCOUNT_FROZEN", "Recipient account is not active", 400);
  }
  // Customers can lookup for transfers; do not expose ownerId.
  if (actor.role === Role.CUSTOMER) return account;
  return account;
}

export async function freezeAccount(
  db: PrismaClient,
  actor: AccountActor,
  accountId: string,
  reason: string,
) {
  if (actor.role === Role.CUSTOMER) throw new AppError("FORBIDDEN", "Not authorized", 403);
  const existing = await db.account.findUnique({
    where: { id: accountId },
    select: { id: true, status: true },
  });
  if (!existing) throw new AppError("NOT_FOUND", "Account not found", 404);
  if (existing.status === AccountStatus.CLOSED) {
    throw new AppError("VALIDATION_ERROR", "Closed account cannot be frozen", 422);
  }
  const account = await db.account.update({
    where: { id: accountId },
    data: { status: AccountStatus.FROZEN, freezeReason: reason },
    select: safeAccountSelect,
  });
  await recordAuditLog(db, {
    actorId: actor.id,
    action: "ACCOUNT_FROZEN",
    entityType: "Account",
    entityId: accountId,
    before: { status: existing.status },
    after: { status: AccountStatus.FROZEN, freezeReason: reason },
  });
  return account;
}

export async function unfreezeAccount(db: PrismaClient, actor: AccountActor, accountId: string) {
  if (actor.role === Role.CUSTOMER) throw new AppError("FORBIDDEN", "Not authorized", 403);
  const existing = await db.account.findUnique({
    where: { id: accountId },
    select: { id: true, status: true },
  });
  if (!existing) throw new AppError("NOT_FOUND", "Account not found", 404);
  if (existing.status === AccountStatus.CLOSED) {
    throw new AppError("VALIDATION_ERROR", "Closed account cannot be unfrozen", 422);
  }
  const account = await db.account.update({
    where: { id: accountId },
    data: { status: AccountStatus.ACTIVE, freezeReason: null },
    select: safeAccountSelect,
  });
  await recordAuditLog(db, {
    actorId: actor.id,
    action: "ACCOUNT_UNFROZEN",
    entityType: "Account",
    entityId: accountId,
    before: { status: existing.status },
    after: { status: AccountStatus.ACTIVE },
  });
  return account;
}

export async function updateAccountLimits(
  db: PrismaClient,
  actor: AccountActor,
  accountId: string,
  input: {
    dailyTransferLimit?: string | null;
    perTxLimit?: string | null;
    minBalance?: string | null;
  },
) {
  if (actor.role === Role.CUSTOMER) throw new AppError("FORBIDDEN", "Not authorized", 403);
  const existing = await db.account.findUnique({
    where: { id: accountId },
    select: { id: true, dailyTransferLimit: true, perTxLimit: true, minBalance: true },
  });
  if (!existing) throw new AppError("NOT_FOUND", "Account not found", 404);

  const data: Prisma.AccountUpdateInput = {};
  if (input.dailyTransferLimit !== undefined)
    data.dailyTransferLimit = decimalOrNull(input.dailyTransferLimit);
  if (input.perTxLimit !== undefined) data.perTxLimit = decimalOrNull(input.perTxLimit);
  if (input.minBalance !== undefined) data.minBalance = decimalOrNull(input.minBalance);

  const account = await db.account.update({
    where: { id: accountId },
    data,
    select: safeAccountSelect,
  });
  await recordAuditLog(db, {
    actorId: actor.id,
    action: "ACCOUNT_LIMITS_UPDATED",
    entityType: "Account",
    entityId: accountId,
    before: {
      dailyTransferLimit: existing.dailyTransferLimit?.toString() ?? null,
      perTxLimit: existing.perTxLimit?.toString() ?? null,
      minBalance: existing.minBalance?.toString() ?? null,
    },
    after: input,
  });
  return account;
}

export async function getAccountStatement(
  db: PrismaClient,
  actor: AccountActor,
  accountId: string,
  input: AccountStatementInput,
) {
  const account = await getAccountById(db, actor, accountId);
  const where: Prisma.TransactionWhereInput = {
    AND: [
      { OR: [{ fromAccountId: accountId }, { toAccountId: accountId }] },
      ...(input.from || input.to
        ? [
            {
              createdAt: {
                ...(input.from ? { gte: input.from } : {}),
                ...(input.to ? { lte: input.to } : {}),
              },
            },
          ]
        : []),
    ],
  };

  const transactions = await db.transaction.findMany({
    where,
    orderBy: { createdAt: "asc" },
    take: 2000,
    select: {
      id: true,
      reference: true,
      type: true,
      status: true,
      amount: true,
      fee: true,
      currency: true,
      description: true,
      createdAt: true,
      completedAt: true,
      fromAccountId: true,
      toAccountId: true,
    },
  });

  return { account, transactions, from: input.from ?? null, to: input.to ?? null };
}
