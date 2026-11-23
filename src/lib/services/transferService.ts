import bcrypt from "bcryptjs";
import {
  AccountStatus,
  EntryDirection,
  NotificationType,
  Prisma,
  PrismaClient,
  Role,
  TxStatus,
  TxType,
  UserStatus,
} from "@prisma/client";
import { AppError } from "@/lib/errors";
import { generateReference } from "@/lib/ids";
import { addMoney, calcTransferFee, gteMoney, subMoney, toDecimal } from "@/lib/money";
import { withSerializableRetry } from "@/lib/prisma-tx";
import type { CreateTransferInput } from "@/lib/validators/transfer";

export type TransferActor = { id: string; role: Role };

type TransferResult = {
  transaction: {
    id: string;
    reference: string;
    type: TxType;
    status: TxStatus;
    amount: Prisma.Decimal;
    fee: Prisma.Decimal;
    currency: string;
    description: string | null;
    fromAccountId: string | null;
    toAccountId: string | null;
    createdAt: Date;
    completedAt: Date | null;
  };
  fromAccount: { id: string; accountNumber: string; balance: Prisma.Decimal };
  toAccount: { id: string; accountNumber: string };
};

async function getSettings(db: PrismaClient | Prisma.TransactionClient) {
  const settings = await db.settings.findUnique({ where: { id: 1 } });
  if (settings) return settings;
  return {
    dailyTransferLimit: toDecimal("200000"),
    maxSingleTransaction: toDecimal("100000"),
    minAccountBalance: toDecimal("0"),
    transferFeePercent: toDecimal("0.50"),
    minTransferFee: toDecimal("5"),
  };
}

function startOfTodayUtc(at?: Date) {
  const now = at ?? new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

async function assertPin(db: PrismaClient, userId: string, pin: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { pinHash: true, pinFailedCount: true, pinLockedUntil: true, status: true },
  });
  if (!user || user.status !== UserStatus.ACTIVE) {
    throw new AppError("UNAUTHORIZED", "Account disabled or blocked", 401);
  }
  if (!user.pinHash) {
    throw new AppError("INVALID_PIN", "Transaction PIN is not set", 400);
  }
  if (user.pinLockedUntil && user.pinLockedUntil > new Date()) {
    throw new AppError("PIN_LOCKED", "PIN is temporarily locked. Try again later.", 423);
  }

  const ok = await bcrypt.compare(pin, user.pinHash);
  if (!ok) {
    const failed = user.pinFailedCount + 1;
    const lock = failed >= 3;
    await db.user.update({
      where: { id: userId },
      data: {
        pinFailedCount: lock ? 0 : failed,
        pinLockedUntil: lock ? new Date(Date.now() + 15 * 60 * 1000) : null,
      },
    });
    if (lock) throw new AppError("PIN_LOCKED", "PIN locked for 15 minutes after failed attempts", 423);
    throw new AppError("INVALID_PIN", "Invalid transaction PIN", 400);
  }

  if (user.pinFailedCount !== 0 || user.pinLockedUntil) {
    await db.user.update({ where: { id: userId }, data: { pinFailedCount: 0, pinLockedUntil: null } });
  }
}

export async function transfer(
  db: PrismaClient,
  actor: TransferActor,
  input: CreateTransferInput,
  options?: { occurredAt?: Date },
): Promise<TransferResult> {
  if (actor.role !== Role.CUSTOMER) {
    throw new AppError("FORBIDDEN", "Only customers can transfer funds", 403);
  }

  const amount = toDecimal(input.amount);
  if (amount.lte(0)) throw new AppError("VALIDATION_ERROR", "Amount must be greater than 0", 422);

  // Idempotency pre-check (fast path)
  const existing = await db.idempotencyKey.findUnique({
    where: { userId_key: { userId: actor.id, key: input.idempotencyKey } },
  });
  if (existing?.responseJson) return existing.responseJson as unknown as TransferResult;

  await assertPin(db, actor.id, input.pin);

  const settings = await getSettings(db);

  const result = await withSerializableRetry(db, async (tx) => {
    const existingKey = await tx.idempotencyKey.findUnique({
      where: { userId_key: { userId: actor.id, key: input.idempotencyKey } },
    });
    if (existingKey?.responseJson) return existingKey.responseJson as unknown as TransferResult;
    if (!existingKey) {
      try {
        await tx.idempotencyKey.create({
          data: { userId: actor.id, key: input.idempotencyKey, endpoint: "POST /api/transfers" },
        });
      } catch (err) {
        if ((err as { code?: string })?.code === "P2002") {
          const dup = await tx.idempotencyKey.findUnique({
            where: { userId_key: { userId: actor.id, key: input.idempotencyKey } },
          });
          if (dup?.responseJson) return dup.responseJson as unknown as TransferResult;
          throw new AppError("DUPLICATE_REQUEST", "Duplicate request in progress", 409);
        }
        throw err;
      }
    }

    const from = await tx.account.findUnique({
      where: { id: input.fromAccountId },
      include: { owner: { select: { id: true, status: true } } },
    });
    if (!from) throw new AppError("NOT_FOUND", "Source account not found", 404);
    if (from.ownerId !== actor.id) throw new AppError("NOT_FOUND", "Source account not found", 404);

    const to = await tx.account.findUnique({
      where: { accountNumber: input.toAccountNumber },
      include: { owner: { select: { id: true, status: true } } },
    });
    if (!to) throw new AppError("RECIPIENT_NOT_FOUND", "Recipient account not found", 404);

    if (from.id === to.id) throw new AppError("SAME_ACCOUNT", "Cannot transfer to the same account", 400);

    // Deterministic lock order
    const ids = [from.id, to.id].sort();
    await tx.$queryRaw`SELECT id FROM "Account" WHERE id IN (${Prisma.join(ids)}) FOR UPDATE`;

    const [lockedFrom, lockedTo] = await Promise.all([
      tx.account.findUniqueOrThrow({ where: { id: from.id }, include: { owner: { select: { id: true, status: true } } } }),
      tx.account.findUniqueOrThrow({ where: { id: to.id }, include: { owner: { select: { id: true, status: true } } } }),
    ]);

    if (lockedFrom.status !== AccountStatus.ACTIVE) throw new AppError("ACCOUNT_FROZEN", "Source account is not active", 400);
    if (lockedTo.status !== AccountStatus.ACTIVE) throw new AppError("ACCOUNT_FROZEN", "Recipient account is not active", 400);
    if (!lockedFrom.owner || lockedFrom.owner.status !== UserStatus.ACTIVE) throw new AppError("FORBIDDEN", "Account owner is not active", 403);
    if (lockedTo.owner && lockedTo.owner.status !== UserStatus.ACTIVE) throw new AppError("FORBIDDEN", "Recipient owner is not active", 403);

    const sameOwner = lockedFrom.ownerId && lockedTo.ownerId && lockedFrom.ownerId === lockedTo.ownerId;
    const fee = sameOwner
      ? toDecimal("0")
      : calcTransferFee(amount, settings.transferFeePercent.toString(), settings.minTransferFee.toString());
    const totalDebit = addMoney(amount, fee);

    const perTxLimit = lockedFrom.perTxLimit ?? settings.maxSingleTransaction;
    if (perTxLimit && amount.gt(toDecimal(perTxLimit.toString()))) {
      throw new AppError("LIMIT_EXCEEDED_SINGLE", "Amount exceeds per-transaction limit", 400);
    }

    const dailyLimit = lockedFrom.dailyTransferLimit ?? settings.dailyTransferLimit;
    const dayStart = startOfTodayUtc(options?.occurredAt);
    const dailyAgg = await tx.transaction.aggregate({
      where: {
        fromAccountId: lockedFrom.id,
        status: { in: [TxStatus.COMPLETED, TxStatus.PENDING] },
        createdAt: { gte: dayStart },
        type: TxType.TRANSFER,
      },
      _sum: { amount: true, fee: true },
    });
    const dailyUsed = addMoney(dailyAgg._sum.amount?.toString() ?? "0", dailyAgg._sum.fee?.toString() ?? "0");
    const projectedDaily = addMoney(dailyUsed, totalDebit);
    if (dailyLimit && projectedDaily.gt(toDecimal(dailyLimit.toString()))) {
      throw new AppError("LIMIT_EXCEEDED_DAILY", "Daily transfer limit exceeded", 400);
    }

    const fromBalance = toDecimal(lockedFrom.balance.toString());
    if (!gteMoney(fromBalance, totalDebit)) {
      throw new AppError("INSUFFICIENT_FUNDS", "Insufficient funds", 400);
    }

    const minBalance = lockedFrom.minBalance ?? settings.minAccountBalance;
    const postBalance = subMoney(fromBalance, totalDebit);
    if (minBalance && postBalance.lt(toDecimal(minBalance.toString()))) {
      throw new AppError("BELOW_MIN_BALANCE", "Transfer would breach minimum balance", 400);
    }

    const toBalance = toDecimal(lockedTo.balance.toString());
    const newFromBalance = postBalance.toDecimalPlaces(2);
    const newToBalance = addMoney(toBalance, amount).toDecimalPlaces(2);

    const reference = generateReference("TXN");
    const at = options?.occurredAt ?? new Date();

    await tx.account.update({ where: { id: lockedFrom.id }, data: { balance: newFromBalance } });
    await tx.account.update({ where: { id: lockedTo.id }, data: { balance: newToBalance } });

    const txRecord = await tx.transaction.create({
      data: {
        reference,
        type: TxType.TRANSFER,
        status: TxStatus.COMPLETED,
        fromAccountId: lockedFrom.id,
        toAccountId: lockedTo.id,
        amount: amount.toDecimalPlaces(2),
        fee: fee.toDecimalPlaces(2),
        currency: "BDT",
        description: input.description,
        initiatedById: actor.id,
        completedAt: at,
        ...(options?.occurredAt ? { createdAt: at } : {}),
      },
    });

    await tx.ledgerEntry.createMany({
      data: [
        {
          transactionId: txRecord.id,
          accountId: lockedFrom.id,
          direction: EntryDirection.DEBIT,
          amount: totalDebit.toDecimalPlaces(2),
          balanceAfter: newFromBalance,
          ...(options?.occurredAt ? { createdAt: at } : {}),
        },
        {
          transactionId: txRecord.id,
          accountId: lockedTo.id,
          direction: EntryDirection.CREDIT,
          amount: amount.toDecimalPlaces(2),
          balanceAfter: newToBalance,
          ...(options?.occurredAt ? { createdAt: at } : {}),
        },
      ],
    });

    if (fee.gt(0)) {
      const system = await tx.account.findFirst({ where: { type: "SYSTEM" }, select: { id: true, balance: true } });
      if (system) {
        const newSystemBalance = addMoney(system.balance.toString(), fee).toDecimalPlaces(2);
        await tx.account.update({ where: { id: system.id }, data: { balance: newSystemBalance } });
        await tx.ledgerEntry.create({
          data: {
            transactionId: txRecord.id,
            accountId: system.id,
            direction: EntryDirection.CREDIT,
            amount: fee.toDecimalPlaces(2),
            balanceAfter: newSystemBalance,
            ...(options?.occurredAt ? { createdAt: at } : {}),
          },
        });
      }
    }

    await tx.notification.createMany({
      data: [
        {
          userId: lockedFrom.ownerId!,
          type: NotificationType.TRANSFER_COMPLETED,
          title: "Transfer completed",
          message: `You sent ${amount.toFixed(2)} BDT to ${lockedTo.accountNumber}.`,
          link: `/transactions/${txRecord.id}`,
          ...(options?.occurredAt ? { createdAt: at } : {}),
        },
        ...(lockedTo.ownerId
          ? [
              {
                userId: lockedTo.ownerId,
                type: NotificationType.MONEY_RECEIVED,
                title: "Money received",
                message: `You received ${amount.toFixed(2)} BDT from ${lockedFrom.accountNumber}.`,
                link: `/transactions/${txRecord.id}`,
                ...(options?.occurredAt ? { createdAt: at } : {}),
              },
            ]
          : []),
      ],
    });

    const response: TransferResult = {
      transaction: {
        id: txRecord.id,
        reference: txRecord.reference,
        type: txRecord.type,
        status: txRecord.status,
        amount: txRecord.amount,
        fee: txRecord.fee,
        currency: txRecord.currency,
        description: txRecord.description,
        fromAccountId: txRecord.fromAccountId,
        toAccountId: txRecord.toAccountId,
        createdAt: txRecord.createdAt,
        completedAt: txRecord.completedAt,
      },
      fromAccount: {
        id: lockedFrom.id,
        accountNumber: lockedFrom.accountNumber,
        balance: newFromBalance,
      },
      toAccount: {
        id: lockedTo.id,
        accountNumber: lockedTo.accountNumber,
      },
    };

    await tx.idempotencyKey.update({
      where: { userId_key: { userId: actor.id, key: input.idempotencyKey } },
      data: { responseJson: response as unknown as Prisma.InputJsonValue },
    });

    return response;
  }, { retries: 3, timeout: 10_000 });

  return result;
}
