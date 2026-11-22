import {
  AccountStatus,
  EntryDirection,
  NotificationType,
  Prisma,
  PrismaClient,
  RequestStatus,
  RequestType,
  Role,
  TxStatus,
  TxType,
  UserStatus,
} from "@prisma/client";
import { AppError } from "@/lib/errors";
import { assertNotSelf } from "@/lib/guards";
import { generateReference } from "@/lib/ids";
import { addMoney, gteMoney, subMoney, toDecimal } from "@/lib/money";
import { buildPaginationMeta, paginationToSkipTake } from "@/lib/pagination";
import { withSerializableRetry } from "@/lib/prisma-tx";
import type { CreateRequestInput } from "@/lib/validators/request";

export type RequestActor = { id: string; role: Role };

const requestSelect = {
  id: true,
  type: true,
  status: true,
  accountId: true,
  requesterId: true,
  amount: true,
  description: true,
  requestedAt: true,
  reviewedById: true,
  reviewedAt: true,
  rejectionReason: true,
  account: { select: { id: true, accountNumber: true, ownerId: true, balance: true, status: true } },
  requester: { select: { id: true, name: true, email: true } },
  reviewer: { select: { id: true, name: true, email: true } },
  transaction: { select: { id: true, reference: true, status: true } },
} satisfies Prisma.DepositWithdrawRequestSelect;

export async function createRequest(db: PrismaClient, actor: RequestActor, input: CreateRequestInput) {
  if (actor.role !== Role.CUSTOMER) throw new AppError("FORBIDDEN", "Only customers can create requests", 403);

  const account = await db.account.findUnique({
    where: { id: input.accountId },
    select: { id: true, ownerId: true, status: true },
  });
  if (!account || account.ownerId !== actor.id) throw new AppError("NOT_FOUND", "Account not found", 404);
  if (account.status !== AccountStatus.ACTIVE) throw new AppError("ACCOUNT_FROZEN", "Account is not active", 400);

  return db.depositWithdrawRequest.create({
    data: {
      type: input.type,
      accountId: input.accountId,
      requesterId: actor.id,
      amount: toDecimal(input.amount).toDecimalPlaces(2),
      description: input.description,
    },
    select: requestSelect,
  });
}

export async function listRequests(
  db: PrismaClient,
  actor: RequestActor,
  input: { page: number; pageSize: number; status?: RequestStatus; type?: RequestType; accountId?: string },
) {
  const where: Prisma.DepositWithdrawRequestWhereInput = {};
  if (actor.role === Role.CUSTOMER) where.requesterId = actor.id;
  if (input.status) where.status = input.status;
  if (input.type) where.type = input.type;
  if (input.accountId) where.accountId = input.accountId;

  const { skip, take } = paginationToSkipTake(input.page, input.pageSize);
  const [total, items] = await Promise.all([
    db.depositWithdrawRequest.count({ where }),
    db.depositWithdrawRequest.findMany({ where, skip, take, orderBy: { requestedAt: "desc" }, select: requestSelect }),
  ]);
  return { items, pagination: buildPaginationMeta(input.page, input.pageSize, total) };
}

export async function getRequestById(db: PrismaClient, actor: RequestActor, requestId: string) {
  const req = await db.depositWithdrawRequest.findUnique({ where: { id: requestId }, select: requestSelect });
  if (!req) throw new AppError("NOT_FOUND", "Request not found", 404);
  if (actor.role === Role.CUSTOMER && req.requesterId !== actor.id) throw new AppError("NOT_FOUND", "Request not found", 404);
  return req;
}

export async function cancelRequest(db: PrismaClient, actor: RequestActor, requestId: string) {
  const req = await db.depositWithdrawRequest.findUnique({ where: { id: requestId }, select: { id: true, requesterId: true, status: true } });
  if (!req) throw new AppError("NOT_FOUND", "Request not found", 404);
  if (actor.role === Role.CUSTOMER && req.requesterId !== actor.id) throw new AppError("NOT_FOUND", "Request not found", 404);
  if (req.status !== RequestStatus.PENDING) throw new AppError("VALIDATION_ERROR", "Only pending requests can be cancelled", 422);

  return db.depositWithdrawRequest.update({
    where: { id: requestId },
    data: { status: RequestStatus.CANCELLED },
    select: requestSelect,
  });
}

export async function rejectRequest(db: PrismaClient, actor: RequestActor, requestId: string, reason: string) {
  if (actor.role === Role.CUSTOMER) throw new AppError("FORBIDDEN", "Not authorized", 403);

  return withSerializableRetry(db, async (tx) => {
    const req = await tx.depositWithdrawRequest.findUnique({ where: { id: requestId } });
    if (!req) throw new AppError("NOT_FOUND", "Request not found", 404);
    assertNotSelf(actor, req.requesterId);
    if (req.status !== RequestStatus.PENDING) throw new AppError("VALIDATION_ERROR", "Request is not pending", 422);

    const updated = await tx.depositWithdrawRequest.update({
      where: { id: requestId },
      data: { status: RequestStatus.REJECTED, reviewedById: actor.id, reviewedAt: new Date(), rejectionReason: reason },
      select: requestSelect,
    });

    await tx.notification.create({
      data: {
        userId: req.requesterId,
        type: req.type === RequestType.DEPOSIT ? NotificationType.DEPOSIT_REJECTED : NotificationType.WITHDRAWAL_REJECTED,
        title: `${req.type === RequestType.DEPOSIT ? "Deposit" : "Withdrawal"} request rejected`,
        message: reason,
        link: `/requests/${req.id}`,
      },
    });

    return updated;
  });
}

export async function approveRequest(db: PrismaClient, actor: RequestActor, requestId: string) {
  if (actor.role === Role.CUSTOMER) throw new AppError("FORBIDDEN", "Not authorized", 403);

  return withSerializableRetry(db, async (tx) => {
    const req = await tx.depositWithdrawRequest.findUnique({ where: { id: requestId } });
    if (!req) throw new AppError("NOT_FOUND", "Request not found", 404);
    assertNotSelf(actor, req.requesterId);
    if (req.status !== RequestStatus.PENDING) throw new AppError("VALIDATION_ERROR", "Request is not pending", 422);

    const account = await tx.account.findUnique({
      where: { id: req.accountId },
      include: { owner: { select: { id: true, status: true } } },
    });
    if (!account) throw new AppError("NOT_FOUND", "Account not found", 404);
    if (account.status !== AccountStatus.ACTIVE) throw new AppError("ACCOUNT_FROZEN", "Account is not active", 400);
    if (!account.owner || account.owner.status !== UserStatus.ACTIVE) throw new AppError("FORBIDDEN", "Account owner is not active", 403);

    const system = await tx.account.findFirst({ where: { type: "SYSTEM" }, select: { id: true, balance: true } });
    if (!system) throw new AppError("INTERNAL_ERROR", "System account not configured", 500);

    const ids = [account.id, system.id].sort();
    await tx.$queryRaw`SELECT id FROM "Account" WHERE id IN (${Prisma.join(ids)}) FOR UPDATE`;
    const [lockedAccount, lockedSystem] = await Promise.all([
      tx.account.findUniqueOrThrow({ where: { id: account.id }, include: { owner: { select: { id: true, status: true } } } }),
      tx.account.findUniqueOrThrow({ where: { id: system.id } }),
    ]);

    if (lockedAccount.status !== AccountStatus.ACTIVE) throw new AppError("ACCOUNT_FROZEN", "Account is not active", 400);
    if (!lockedAccount.owner || lockedAccount.owner.status !== UserStatus.ACTIVE) throw new AppError("FORBIDDEN", "Account owner is not active", 403);

    const amount = toDecimal(req.amount.toString());
    let fromId: string;
    let toId: string;
    let txType: TxType;

    if (req.type === RequestType.DEPOSIT) {
      fromId = lockedSystem.id;
      toId = lockedAccount.id;
      txType = TxType.DEPOSIT;
    } else {
      fromId = lockedAccount.id;
      toId = lockedSystem.id;
      txType = TxType.WITHDRAWAL;

      const fromBalance = toDecimal(lockedAccount.balance.toString());
      if (!gteMoney(fromBalance, amount)) throw new AppError("INSUFFICIENT_FUNDS", "Insufficient funds", 400);
      const minBalance = lockedAccount.minBalance ?? toDecimal("0");
      const post = subMoney(fromBalance, amount);
      if (post.lt(toDecimal(minBalance.toString()))) throw new AppError("BELOW_MIN_BALANCE", "Withdrawal would breach minimum balance", 400);
    }

    const lockedFrom = fromId === lockedAccount.id ? lockedAccount : lockedSystem;
    const lockedTo = toId === lockedAccount.id ? lockedAccount : lockedSystem;
    const newFromBalance = subMoney(lockedFrom.balance.toString(), amount).toDecimalPlaces(2);
    const newToBalance = addMoney(lockedTo.balance.toString(), amount).toDecimalPlaces(2);

    await tx.account.update({ where: { id: lockedFrom.id }, data: { balance: newFromBalance } });
    await tx.account.update({ where: { id: lockedTo.id }, data: { balance: newToBalance } });

    const reference = generateReference("TXN");
    const now = new Date();
    const txRecord = await tx.transaction.create({
      data: {
        reference,
        type: txType,
        status: TxStatus.COMPLETED,
        fromAccountId: fromId,
        toAccountId: toId,
        amount: amount.toDecimalPlaces(2),
        fee: toDecimal("0").toDecimalPlaces(2),
        currency: "BDT",
        description: req.description,
        initiatedById: req.requesterId,
        requestId: req.id,
        completedAt: now,
      },
    });

    await tx.ledgerEntry.createMany({
      data: [
        { transactionId: txRecord.id, accountId: fromId, direction: EntryDirection.DEBIT, amount: amount.toDecimalPlaces(2), balanceAfter: newFromBalance },
        { transactionId: txRecord.id, accountId: toId, direction: EntryDirection.CREDIT, amount: amount.toDecimalPlaces(2), balanceAfter: newToBalance },
      ],
    });

    const updated = await tx.depositWithdrawRequest.update({
      where: { id: req.id },
      data: { status: RequestStatus.APPROVED, reviewedById: actor.id, reviewedAt: now },
      select: requestSelect,
    });

    await tx.notification.create({
      data: {
        userId: req.requesterId,
        type: req.type === RequestType.DEPOSIT ? NotificationType.DEPOSIT_APPROVED : NotificationType.WITHDRAWAL_APPROVED,
        title: `${req.type === RequestType.DEPOSIT ? "Deposit" : "Withdrawal"} request approved`,
        message: `${amount.toFixed(2)} BDT has been ${req.type === RequestType.DEPOSIT ? "deposited to" : "withdrawn from"} your account.`,
        link: `/requests/${req.id}`,
      },
    });

    return updated;
  });
}
