import {
  EntryDirection,
  FlagSource,
  NotificationType,
  Prisma,
  PrismaClient,
  Role,
  TxStatus,
} from "@prisma/client";
import { AppError } from "@/lib/errors";
import { generateReference } from "@/lib/ids";
import { addMoney, gteMoney, subMoney, toDecimal } from "@/lib/money";
import { buildPaginationMeta, paginationToSkipTake } from "@/lib/pagination";
import { withSerializableRetry } from "@/lib/prisma-tx";
import type { TransactionListInput } from "@/lib/validators/transaction";

export type TxActor = { id: string; role: Role };

const txSelect = {
  id: true,
  reference: true,
  type: true,
  status: true,
  fromAccountId: true,
  toAccountId: true,
  amount: true,
  fee: true,
  currency: true,
  description: true,
  failureReason: true,
  reversalOfId: true,
  initiatedById: true,
  requestId: true,
  createdAt: true,
  completedAt: true,
  fromAccount: { select: { id: true, accountNumber: true, ownerId: true } },
  toAccount: { select: { id: true, accountNumber: true, ownerId: true } },
} satisfies Prisma.TransactionSelect;

export async function listTransactions(
  db: PrismaClient,
  actor: TxActor,
  input: TransactionListInput,
) {
  const where: Prisma.TransactionWhereInput = {};

  if (actor.role === Role.CUSTOMER) {
    where.OR = [{ fromAccount: { ownerId: actor.id } }, { toAccount: { ownerId: actor.id } }];
  }

  if (input.accountId) {
    if (actor.role === Role.CUSTOMER) {
      const owns = await db.account.findFirst({
        where: { id: input.accountId, ownerId: actor.id },
        select: { id: true },
      });
      if (!owns) throw new AppError("NOT_FOUND", "Account not found", 404);
    }
    where.AND = [
      ...((where.AND as Prisma.TransactionWhereInput[]) ?? []),
      { OR: [{ fromAccountId: input.accountId }, { toAccountId: input.accountId }] },
    ];
  }

  if (input.type) where.type = input.type;
  if (input.status) where.status = input.status;
  if (input.from || input.to) {
    where.createdAt = {};
    if (input.from) (where.createdAt as Prisma.DateTimeFilter).gte = input.from;
    if (input.to) (where.createdAt as Prisma.DateTimeFilter).lte = input.to;
  }
  if (input.q) {
    where.reference = { contains: input.q, mode: "insensitive" };
  }

  const { skip, take } = paginationToSkipTake(input.page, input.pageSize);
  const [total, items] = await Promise.all([
    db.transaction.count({ where }),
    db.transaction.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      select: txSelect,
    }),
  ]);
  return { items, pagination: buildPaginationMeta(input.page, input.pageSize, total) };
}

export async function getTransactionById(db: PrismaClient, actor: TxActor, txId: string) {
  const tx = await db.transaction.findUnique({
    where: { id: txId },
    select: {
      ...txSelect,
      ledger: {
        select: {
          id: true,
          accountId: true,
          direction: true,
          amount: true,
          balanceAfter: true,
          createdAt: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!tx) throw new AppError("NOT_FOUND", "Transaction not found", 404);

  if (actor.role === Role.CUSTOMER) {
    const involved = tx.fromAccount?.ownerId === actor.id || tx.toAccount?.ownerId === actor.id;
    if (!involved) throw new AppError("NOT_FOUND", "Transaction not found", 404);
  }
  return tx;
}

export async function reverseTransaction(db: PrismaClient, actor: TxActor, txId: string) {
  if (actor.role !== Role.ADMIN)
    throw new AppError("FORBIDDEN", "Only admins can reverse transactions", 403);

  return withSerializableRetry(db, async (tx) => {
    const original = await tx.transaction.findUnique({
      where: { id: txId },
      include: {
        fromAccount: { include: { owner: { select: { id: true, status: true } } } },
        toAccount: { include: { owner: { select: { id: true, status: true } } } },
        reversedBy: { select: { id: true } },
      },
    });
    if (!original) throw new AppError("NOT_FOUND", "Transaction not found", 404);
    if (original.status !== TxStatus.COMPLETED)
      throw new AppError("VALIDATION_ERROR", "Only completed transactions can be reversed", 422);
    if (original.reversedBy)
      throw new AppError("VALIDATION_ERROR", "Transaction already reversed", 422);
    if (!original.fromAccountId || !original.toAccountId)
      throw new AppError("VALIDATION_ERROR", "Transaction cannot be reversed", 422);

    // Reverse main amount: receiver -> sender. Fee (if any) refunded from system -> sender.
    const sender = original.fromAccount!;
    const receiver = original.toAccount!;
    const amount = toDecimal(original.amount.toString());
    const fee = toDecimal(original.fee.toString());

    let systemAccountId: string | null = null;
    if (fee.gt(0)) {
      const sys = await tx.account.findFirst({ where: { type: "SYSTEM" }, select: { id: true } });
      systemAccountId = sys?.id ?? null;
    }

    const lockIds = [sender.id, receiver.id, ...(systemAccountId ? [systemAccountId] : [])]
      .filter((v, i, a) => a.indexOf(v) === i)
      .sort();
    await tx.$queryRaw`SELECT id FROM "Account" WHERE id IN (${Prisma.join(lockIds)}) FOR UPDATE`;

    const [lockedSender, lockedReceiver, lockedSystem] = await Promise.all([
      tx.account.findUniqueOrThrow({
        where: { id: sender.id },
        include: { owner: { select: { id: true, status: true } } },
      }),
      tx.account.findUniqueOrThrow({
        where: { id: receiver.id },
        include: { owner: { select: { id: true, status: true } } },
      }),
      systemAccountId
        ? tx.account.findUniqueOrThrow({
            where: { id: systemAccountId },
            select: { id: true, balance: true },
          })
        : Promise.resolve(null),
    ]);

    const receiverBalance = toDecimal(lockedReceiver.balance.toString());
    if (!gteMoney(receiverBalance, amount)) {
      throw new AppError("INSUFFICIENT_FUNDS", "Receiver has insufficient funds for reversal", 400);
    }

    if (fee.gt(0) && lockedSystem && !gteMoney(toDecimal(lockedSystem.balance.toString()), fee)) {
      throw new AppError(
        "INSUFFICIENT_FUNDS",
        "System account has insufficient funds to refund fee",
        400,
      );
    }

    const newReceiverBalance = subMoney(receiverBalance, amount).toDecimalPlaces(2);
    const refundTotal = addMoney(amount, fee);
    const newSenderBalance = addMoney(lockedSender.balance.toString(), refundTotal).toDecimalPlaces(
      2,
    );

    await tx.account.update({
      where: { id: lockedReceiver.id },
      data: { balance: newReceiverBalance },
    });
    await tx.account.update({
      where: { id: lockedSender.id },
      data: { balance: newSenderBalance },
    });

    const now = new Date();
    const reversal = await tx.transaction.create({
      data: {
        reference: generateReference("TXN"),
        type: original.type,
        status: TxStatus.COMPLETED,
        fromAccountId: lockedReceiver.id,
        toAccountId: lockedSender.id,
        amount: amount.toDecimalPlaces(2),
        fee: toDecimal("0").toDecimalPlaces(2),
        currency: original.currency,
        description: `Reversal of ${original.reference}`,
        reversalOfId: original.id,
        initiatedById: actor.id,
        completedAt: now,
      },
    });

    const ledgerData: Prisma.LedgerEntryCreateManyInput[] = [
      {
        transactionId: reversal.id,
        accountId: lockedReceiver.id,
        direction: EntryDirection.DEBIT,
        amount: amount.toDecimalPlaces(2),
        balanceAfter: newReceiverBalance,
      },
      {
        transactionId: reversal.id,
        accountId: lockedSender.id,
        direction: EntryDirection.CREDIT,
        amount: refundTotal.toDecimalPlaces(2),
        balanceAfter: newSenderBalance,
      },
    ];

    if (fee.gt(0) && lockedSystem) {
      const newSystemBalance = subMoney(lockedSystem.balance.toString(), fee).toDecimalPlaces(2);
      await tx.account.update({
        where: { id: lockedSystem.id },
        data: { balance: newSystemBalance },
      });
      ledgerData.push({
        transactionId: reversal.id,
        accountId: lockedSystem.id,
        direction: EntryDirection.DEBIT,
        amount: fee.toDecimalPlaces(2),
        balanceAfter: newSystemBalance,
      });
    }

    await tx.ledgerEntry.createMany({ data: ledgerData });
    await tx.transaction.update({
      where: { id: original.id },
      data: { status: TxStatus.REVERSED },
    });

    const notifications: Prisma.NotificationCreateManyInput[] = [];
    if (lockedSender.ownerId)
      notifications.push({
        userId: lockedSender.ownerId,
        type: NotificationType.TRANSFER_COMPLETED,
        title: "Transaction reversed",
        message: `Transaction ${original.reference} was reversed.`,
        link: `/transactions/${reversal.id}`,
      });
    if (lockedReceiver.ownerId)
      notifications.push({
        userId: lockedReceiver.ownerId,
        type: NotificationType.TRANSFER_COMPLETED,
        title: "Transaction reversed",
        message: `Transaction ${original.reference} was reversed.`,
        link: `/transactions/${reversal.id}`,
      });
    if (notifications.length) await tx.notification.createMany({ data: notifications });

    return reversal;
  });
}

export async function flagTransaction(
  db: PrismaClient,
  actor: TxActor,
  txId: string,
  reason: string,
  options?: { occurredAt?: Date },
) {
  if (actor.role === Role.CUSTOMER) throw new AppError("FORBIDDEN", "Not authorized", 403);
  const tx = await db.transaction.findUnique({ where: { id: txId }, select: { id: true } });
  if (!tx) throw new AppError("NOT_FOUND", "Transaction not found", 404);

  const source = actor.role === Role.ADMIN ? FlagSource.ADMIN : FlagSource.STAFF;
  return db.suspiciousFlag.create({
    data: {
      transactionId: txId,
      source,
      reason,
      raisedById: actor.id,
      ...(options?.occurredAt ? { createdAt: options.occurredAt } : {}),
    },
  });
}
