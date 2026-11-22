import {
  AccountStatus,
  EntryDirection,
  LoanStatus,
  NotificationType,
  Prisma,
  PrismaClient,
  Role,
  TxStatus,
  TxType,
  UserStatus,
} from "@prisma/client";
import { AppError } from "@/lib/errors";
import { assertNotSelf } from "@/lib/guards";
import { generateReference } from "@/lib/ids";
import { addMoney, subMoney, toDecimal } from "@/lib/money";
import { buildPaginationMeta, paginationToSkipTake } from "@/lib/pagination";
import { withSerializableRetry } from "@/lib/prisma-tx";
import { generateInstallments } from "@/lib/emi";
import type { LoanListInput } from "@/lib/validators/loan";

export type LoanActor = { id: string; role: Role };

const loanSelect = {
  id: true,
  loanNo: true,
  applicantId: true,
  type: true,
  requestedAmount: true,
  approvedAmount: true,
  durationMonths: true,
  interestRate: true,
  emiAmount: true,
  monthlyIncome: true,
  employmentStatus: true,
  description: true,
  status: true,
  disbursementAccountId: true,
  disbursementTxId: true,
  totalPayable: true,
  remainingBalance: true,
  forwardedById: true,
  reviewedById: true,
  reviewedAt: true,
  rejectionReason: true,
  appliedAt: true,
  disbursedAt: true,
  completedAt: true,
  applicant: { select: { id: true, name: true, email: true } },
  reviewer: { select: { id: true, name: true, email: true } },
} satisfies Prisma.LoanSelect;

async function getLoanInterestRate(db: PrismaClient | Prisma.TransactionClient, type: string) {
  const settings = await db.settings.findUnique({ where: { id: 1 } });
  const rates = (settings?.loanInterestRates as Record<string, number> | undefined) ?? {};
  const rate = rates[type];
  if (typeof rate === "number") return rate;
  // fallback defaults
  const defaults: Record<string, number> = {
    PERSONAL: 12,
    HOME: 10,
    AUTO: 11,
    EDUCATION: 8,
    BUSINESS: 14,
  };
  return defaults[type] ?? 12;
}

export async function listLoans(db: PrismaClient, actor: LoanActor, input: LoanListInput) {
  const where: Prisma.LoanWhereInput = {};
  if (actor.role === Role.CUSTOMER) where.applicantId = actor.id;
  if (input.status) where.status = input.status;
  if (input.applicantId && actor.role !== Role.CUSTOMER) where.applicantId = input.applicantId;
  if (input.q) {
    where.OR = [
      { loanNo: { contains: input.q, mode: "insensitive" } },
      { applicant: { name: { contains: input.q, mode: "insensitive" } } },
      { applicant: { email: { contains: input.q, mode: "insensitive" } } },
    ];
  }
  const { skip, take } = paginationToSkipTake(input.page, input.pageSize);
  const [total, items] = await Promise.all([
    db.loan.count({ where }),
    db.loan.findMany({ where, skip, take, orderBy: { appliedAt: "desc" }, select: loanSelect }),
  ]);
  return { items, pagination: buildPaginationMeta(input.page, input.pageSize, total) };
}

export async function getLoanById(db: PrismaClient, actor: LoanActor, loanId: string) {
  const loan = await db.loan.findUnique({
    where: { id: loanId },
    select: {
      ...loanSelect,
      installments: { orderBy: { number: "asc" } },
      notes: {
        orderBy: { createdAt: "desc" },
        include: { author: { select: { id: true, name: true, role: true } } },
      },
    },
  });
  if (!loan) throw new AppError("NOT_FOUND", "Loan not found", 404);
  if (actor.role === Role.CUSTOMER && loan.applicantId !== actor.id)
    throw new AppError("NOT_FOUND", "Loan not found", 404);
  return loan;
}

export async function addLoanNote(
  db: PrismaClient,
  actor: LoanActor,
  loanId: string,
  body: string,
  internal = true,
) {
  if (actor.role === Role.CUSTOMER) throw new AppError("FORBIDDEN", "Not authorized", 403);
  const loan = await db.loan.findUnique({ where: { id: loanId }, select: { id: true } });
  if (!loan) throw new AppError("NOT_FOUND", "Loan not found", 404);
  return db.loanNote.create({
    data: { loanId, authorId: actor.id, body, internal },
    include: { author: { select: { id: true, name: true, role: true } } },
  });
}

export async function forwardLoan(
  db: PrismaClient,
  actor: LoanActor,
  loanId: string,
  note?: string,
) {
  if (actor.role === Role.CUSTOMER) throw new AppError("FORBIDDEN", "Not authorized", 403);
  return withSerializableRetry(db, async (tx) => {
    const loan = await tx.loan.findUnique({ where: { id: loanId } });
    if (!loan) throw new AppError("NOT_FOUND", "Loan not found", 404);
    if (loan.status !== LoanStatus.PENDING && loan.status !== LoanStatus.UNDER_REVIEW) {
      throw new AppError("VALIDATION_ERROR", "Loan cannot be forwarded in current status", 422);
    }
    const updated = await tx.loan.update({
      where: { id: loanId },
      data: { status: LoanStatus.UNDER_REVIEW, forwardedById: actor.id },
      select: loanSelect,
    });
    if (note) {
      await tx.loanNote.create({
        data: { loanId, authorId: actor.id, body: note, internal: true },
      });
    }
    return updated;
  });
}

export async function rejectLoan(
  db: PrismaClient,
  actor: LoanActor,
  loanId: string,
  reason: string,
) {
  if (actor.role === Role.CUSTOMER) throw new AppError("FORBIDDEN", "Not authorized", 403);
  return withSerializableRetry(db, async (tx) => {
    const loan = await tx.loan.findUnique({ where: { id: loanId } });
    if (!loan) throw new AppError("NOT_FOUND", "Loan not found", 404);
    assertNotSelf(actor, loan.applicantId);
    if (loan.status !== LoanStatus.PENDING && loan.status !== LoanStatus.UNDER_REVIEW) {
      throw new AppError("VALIDATION_ERROR", "Loan cannot be rejected in current status", 422);
    }
    const updated = await tx.loan.update({
      where: { id: loanId },
      data: {
        status: LoanStatus.REJECTED,
        reviewedById: actor.id,
        reviewedAt: new Date(),
        rejectionReason: reason,
      },
      select: loanSelect,
    });
    await tx.notification.create({
      data: {
        userId: loan.applicantId,
        type: NotificationType.LOAN_REJECTED,
        title: "Loan rejected",
        message: reason,
        link: `/loans/${loan.id}`,
      },
    });
    return updated;
  });
}

export async function approveLoan(
  db: PrismaClient,
  actor: LoanActor,
  loanId: string,
  input: { disbursementAccountId: string; approvedAmount?: string },
) {
  if (actor.role === Role.CUSTOMER) throw new AppError("FORBIDDEN", "Not authorized", 403);

  return withSerializableRetry(db, async (tx) => {
    const loan = await tx.loan.findUnique({
      where: { id: loanId },
      include: { applicant: { select: { id: true, status: true } } },
    });
    if (!loan) throw new AppError("NOT_FOUND", "Loan not found", 404);
    assertNotSelf(actor, loan.applicantId);
    if (loan.status !== LoanStatus.PENDING && loan.status !== LoanStatus.UNDER_REVIEW) {
      throw new AppError("VALIDATION_ERROR", "Loan cannot be approved in current status", 422);
    }
    if (loan.applicant.status !== UserStatus.ACTIVE)
      throw new AppError("VALIDATION_ERROR", "Applicant is not active", 422);

    const disbAccount = await tx.account.findUnique({
      where: { id: input.disbursementAccountId },
      include: { owner: { select: { id: true, status: true } } },
    });
    if (!disbAccount || disbAccount.ownerId !== loan.applicantId)
      throw new AppError("NOT_FOUND", "Disbursement account not found", 404);
    if (disbAccount.status !== AccountStatus.ACTIVE)
      throw new AppError("ACCOUNT_FROZEN", "Disbursement account is not active", 400);

    const system = await tx.account.findFirst({
      where: { type: "SYSTEM" },
      select: { id: true, balance: true },
    });
    if (!system) throw new AppError("INTERNAL_ERROR", "System account not configured", 500);

    const lockIds = [system.id, disbAccount.id].sort();
    await tx.$queryRaw`SELECT id FROM "Account" WHERE id IN (${Prisma.join(lockIds)}) FOR UPDATE`;
    const [lockedSystem, lockedDisb] = await Promise.all([
      tx.account.findUniqueOrThrow({ where: { id: system.id } }),
      tx.account.findUniqueOrThrow({ where: { id: disbAccount.id } }),
    ]);

    const approvedAmount = toDecimal(
      input.approvedAmount ?? loan.requestedAmount.toString(),
    ).toDecimalPlaces(2);
    if (approvedAmount.lte(0))
      throw new AppError("VALIDATION_ERROR", "Approved amount must be positive", 422);
    if (approvedAmount.gt(toDecimal(loan.requestedAmount.toString())))
      throw new AppError("VALIDATION_ERROR", "Approved amount exceeds requested amount", 422);

    const rate = await getLoanInterestRate(tx, loan.type);
    const schedule = generateInstallments({
      principal: approvedAmount.toFixed(2),
      annualRatePercent: rate,
      months: loan.durationMonths,
      startDate: new Date(),
    });
    const totalPayable = schedule.items
      .reduce((acc, i) => addMoney(acc, i.amount), toDecimal("0"))
      .toDecimalPlaces(2);

    const newSystemBalance = subMoney(
      lockedSystem.balance.toString(),
      approvedAmount,
    ).toDecimalPlaces(2);
    const newDisbBalance = addMoney(lockedDisb.balance.toString(), approvedAmount).toDecimalPlaces(
      2,
    );
    if (newSystemBalance.lt(0))
      throw new AppError(
        "INSUFFICIENT_FUNDS",
        "System account has insufficient funds for disbursement",
        400,
      );

    await tx.account.update({
      where: { id: lockedSystem.id },
      data: { balance: newSystemBalance },
    });
    await tx.account.update({ where: { id: lockedDisb.id }, data: { balance: newDisbBalance } });

    const now = new Date();
    const txRecord = await tx.transaction.create({
      data: {
        reference: generateReference("TXN"),
        type: TxType.LOAN_DISBURSEMENT,
        status: TxStatus.COMPLETED,
        fromAccountId: lockedSystem.id,
        toAccountId: lockedDisb.id,
        amount: approvedAmount,
        fee: toDecimal("0").toDecimalPlaces(2),
        currency: "BDT",
        description: `Loan disbursement ${loan.loanNo}`,
        initiatedById: actor.id,
        completedAt: now,
      },
    });

    await tx.ledgerEntry.createMany({
      data: [
        {
          transactionId: txRecord.id,
          accountId: lockedSystem.id,
          direction: EntryDirection.DEBIT,
          amount: approvedAmount,
          balanceAfter: newSystemBalance,
        },
        {
          transactionId: txRecord.id,
          accountId: lockedDisb.id,
          direction: EntryDirection.CREDIT,
          amount: approvedAmount,
          balanceAfter: newDisbBalance,
        },
      ],
    });

    const updatedLoan = await tx.loan.update({
      where: { id: loan.id },
      data: {
        status: LoanStatus.ACTIVE,
        approvedAmount,
        interestRate: toDecimal(rate).toDecimalPlaces(2),
        emiAmount: toDecimal(schedule.emi).toDecimalPlaces(2),
        totalPayable,
        remainingBalance: totalPayable,
        disbursementAccountId: lockedDisb.id,
        disbursementTxId: txRecord.id,
        reviewedById: actor.id,
        reviewedAt: now,
        disbursedAt: now,
      },
      select: loanSelect,
    });

    await tx.loanInstallment.createMany({
      data: schedule.items.map((i) => ({
        loanId: loan.id,
        number: i.number,
        dueDate: i.dueDate,
        principal: toDecimal(i.principal).toDecimalPlaces(2),
        interest: toDecimal(i.interest).toDecimalPlaces(2),
        amount: toDecimal(i.amount).toDecimalPlaces(2),
        status: "UPCOMING",
      })),
    });

    await tx.notification.create({
      data: {
        userId: loan.applicantId,
        type: NotificationType.LOAN_APPROVED,
        title: "Loan approved",
        message: `Your loan ${loan.loanNo} was approved and disbursed.`,
        link: `/loans/${loan.id}`,
      },
    });

    return { loan: updatedLoan, disbursementTransactionId: txRecord.id };
  });
}
