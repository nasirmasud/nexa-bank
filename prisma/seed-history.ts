import {
  AccountStatus,
  AccountType,
  EmploymentStatus,
  LoanType,
  Prisma,
  PrismaClient,
  RequestType,
  Role,
  UserStatus,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import { approveRequest, createRequest } from "../src/lib/services/requestService";
import { transfer } from "../src/lib/services/transferService";
import {
  applyLoan,
  approveLoan,
  forwardLoan,
  payLoanInstallment,
  rejectLoan,
} from "../src/lib/services/loanService";
import { flagTransaction } from "../src/lib/services/transactionService";
import { resolveSuspiciousFlag } from "../src/lib/services/suspiciousFlagService";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "Password@123";
const DEMO_PIN = "123456";
const HISTORY_MARKER_DAYS = 90;
const HISTORY_MIN_OLD_TX = 20;

function monthsAgo(months: number, day = 15, hour = 12) {
  const d = new Date();
  d.setUTCMonth(d.getUTCMonth() - months, day);
  d.setUTCHours(hour, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

async function patchTxTime(txId: string, at: Date) {
  await prisma.$executeRaw`
    UPDATE "Transaction"
    SET "createdAt" = ${at}, "completedAt" = ${at}
    WHERE "id" = ${txId}
  `;
  await prisma.$executeRaw`
    UPDATE "LedgerEntry"
    SET "createdAt" = ${at}
    WHERE "transactionId" = ${txId}
  `;
}

async function patchRequestTime(requestId: string, at: Date) {
  await prisma.$executeRaw`
    UPDATE "DepositWithdrawRequest"
    SET "requestedAt" = ${at}, "reviewedAt" = ${at}
    WHERE "id" = ${requestId}
  `;
}

async function patchLoanTime(loanId: string, at: Date) {
  await prisma.$executeRaw`
    UPDATE "Loan"
    SET "appliedAt" = ${at}, "reviewedAt" = ${at}, "disbursedAt" = ${at}
    WHERE "id" = ${loanId}
  `;
}

async function patchFlagTime(flagId: string, at: Date) {
  await prisma.$executeRaw`
    UPDATE "SuspiciousFlag"
    SET "createdAt" = ${at}, "resolvedAt" = ${at}
    WHERE "id" = ${flagId}
  `;
}

async function patchInstallmentDue(loanId: string) {
  const installments = await prisma.loanInstallment.findMany({
    where: { loanId },
    orderBy: { number: "asc" },
    select: { id: true, number: true },
  });
  const base = monthsAgo(6, 10);
  for (const inst of installments) {
    const due = addDays(base, inst.number * 30);
    await prisma.$executeRaw`
      UPDATE "LoanInstallment"
      SET "dueDate" = ${due}
      WHERE "id" = ${inst.id}
    `;
  }
}

async function ensureBaseSeed() {
  const admin = await prisma.user.findUnique({ where: { email: "admin@nexabank.com" } });
  const system = await prisma.account.findFirst({ where: { type: AccountType.SYSTEM } });
  if (!admin || !system) {
    throw new Error("Base seed missing. Run `npm run db:seed` first.");
  }
}

async function ensurePins() {
  const pinHash = await bcrypt.hash(DEMO_PIN, 10);
  await prisma.user.updateMany({
    where: { role: Role.CUSTOMER, status: UserStatus.ACTIVE },
    data: { pinHash, pinFailedCount: 0, pinLockedUntil: null },
  });
}

async function ensureSettingsForSeed() {
  await prisma.settings.upsert({
    where: { id: 1 },
    update: {
      dailyTransferLimit: new Prisma.Decimal("5000000"),
      maxSingleTransaction: new Prisma.Decimal("2000000"),
      minAccountBalance: new Prisma.Decimal("0"),
      transferFeePercent: new Prisma.Decimal("0.50"),
      minTransferFee: new Prisma.Decimal("5"),
    },
    create: {
      id: 1,
      dailyTransferLimit: new Prisma.Decimal("5000000"),
      maxSingleTransaction: new Prisma.Decimal("2000000"),
      minAccountBalance: new Prisma.Decimal("0"),
      transferFeePercent: new Prisma.Decimal("0.50"),
      minTransferFee: new Prisma.Decimal("5"),
      loanIncomeMultiplier: 20,
      loanInterestRates: { PERSONAL: 12, HOME: 9, AUTO: 10, EDUCATION: 8, BUSINESS: 11 },
    },
  });
}

async function getUsers() {
  const users = await prisma.user.findMany({
    where: { email: { in: ["admin@nexabank.com", "staff1@nexabank.com", "staff2@nexabank.com", "customer1@nexabank.com", "customer2@nexabank.com", "customer3@nexabank.com", "customer4@nexabank.com", "customer5@nexabank.com", "customer6@nexabank.com", "customer7@nexabank.com", "customer8@nexabank.com"] } },
    select: { id: true, email: true, role: true },
  });
  const byEmail = Object.fromEntries(users.map((u) => [u.email, u]));
  return {
    admin: byEmail["admin@nexabank.com"],
    staff1: byEmail["staff1@nexabank.com"],
    staff2: byEmail["staff2@nexabank.com"],
    c1: byEmail["customer1@nexabank.com"],
    c2: byEmail["customer2@nexabank.com"],
    c3: byEmail["customer3@nexabank.com"],
    c4: byEmail["customer4@nexabank.com"],
    c5: byEmail["customer5@nexabank.com"],
    c6: byEmail["customer6@nexabank.com"],
    c7: byEmail["customer7@nexabank.com"],
    c8: byEmail["customer8@nexabank.com"],
  };
}

async function getAccounts() {
  const accounts = await prisma.account.findMany({
    where: { type: { not: AccountType.SYSTEM }, status: AccountStatus.ACTIVE },
    select: { id: true, accountNumber: true, ownerId: true, type: true },
    orderBy: { accountNumber: "asc" },
  });
  const byNum = Object.fromEntries(accounts.map((a) => [a.accountNumber, a]));
  return { accounts, byNum };
}

async function deposit(admin: { id: string; role: Role }, customer: { id: string; role: Role }, accountId: string, amount: string, at: Date, description: string) {
  const req = await createRequest(prisma, { id: customer.id, role: customer.role }, {
    type: RequestType.DEPOSIT,
    accountId,
    amount,
    description,
  });
  const approved = await approveRequest(prisma, { id: admin.id, role: admin.role }, req.id);
  const txId = (approved as { transaction?: { id: string } | null }).transaction?.id;
  await patchRequestTime(req.id, at);
  if (txId) await patchTxTime(txId, at);
  return { requestId: req.id, txId };
}

async function withdraw(admin: { id: string; role: Role }, customer: { id: string; role: Role }, accountId: string, amount: string, at: Date, description: string) {
  const req = await createRequest(prisma, { id: customer.id, role: customer.role }, {
    type: RequestType.WITHDRAWAL,
    accountId,
    amount,
    description,
  });
  const approved = await approveRequest(prisma, { id: admin.id, role: admin.role }, req.id);
  const txId = (approved as { transaction?: { id: string } | null }).transaction?.id;
  await patchRequestTime(req.id, at);
  if (txId) await patchTxTime(txId, at);
  return { requestId: req.id, txId };
}

async function doTransfer(fromCustomer: { id: string; role: Role }, fromAccountId: string, toAccountNumber: string, amount: string, at: Date, description: string, key: string) {
  const result = await transfer(prisma, { id: fromCustomer.id, role: fromCustomer.role }, {
    fromAccountId,
    toAccountNumber,
    amount,
    pin: DEMO_PIN,
    description,
    idempotencyKey: key,
  });
  await patchTxTime(result.transaction.id, at);
  return result;
}

async function verifyInvariant() {
  const accounts = await prisma.account.findMany({ select: { id: true, accountNumber: true, balance: true } });
  const balanceSum = accounts.reduce((acc, a) => acc.add(new Prisma.Decimal(a.balance.toString())), new Prisma.Decimal(0));

  const ledger = await prisma.ledgerEntry.groupBy({
    by: ["direction"],
    _sum: { amount: true },
  });
  const debit = ledger.find((l) => l.direction === "DEBIT")?._sum.amount ?? new Prisma.Decimal(0);
  const credit = ledger.find((l) => l.direction === "CREDIT")?._sum.amount ?? new Prisma.Decimal(0);
  const ledgerNet = new Prisma.Decimal(credit.toString()).sub(new Prisma.Decimal(debit.toString()));

  const mismatches: string[] = [];
  if (!debit.equals(credit)) {
    mismatches.push(`Ledger not balanced: DEBIT=${debit.toString()} CREDIT=${credit.toString()}`);
  }

  // Verify each account balance matches latest ledger balanceAfter
  for (const acc of accounts) {
    const last = await prisma.ledgerEntry.findFirst({
      where: { accountId: acc.id },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: { balanceAfter: true },
    });
    if (last && !new Prisma.Decimal(acc.balance.toString()).equals(new Prisma.Decimal(last.balanceAfter.toString()))) {
      mismatches.push(`Account ${acc.accountNumber} balance ${acc.balance.toString()} != last ledger ${last.balanceAfter.toString()}`);
    }
  }

  // Closed double-entry invariant: sum of all account balances equals initial total (100000000.00 from base seed system account)
  // and equals ledger net across all entries (should be 0 net difference, so total balances conserved).
  const expectedTotal = new Prisma.Decimal("100000000.00");
  if (!balanceSum.equals(expectedTotal)) {
    mismatches.push(`Sum of account balances ${balanceSum.toString()} != expected ${expectedTotal.toString()}`);
  }
  if (!ledgerNet.equals(0)) {
    mismatches.push(`Ledger net (CREDIT-DEBIT) ${ledgerNet.toString()} != 0`);
  }

  console.log(`Invariant check: debit=${debit.toString()} credit=${credit.toString()} ledgerNet=${ledgerNet.toString()} totalBalances=${balanceSum.toString()} expected=${expectedTotal.toString()}`);
  if (mismatches.length) {
    throw new Error(`Ledger invariant failed:\n${mismatches.join("\n")}`);
  }
}

async function main() {
  console.log("Seed history: starting...");
  console.log("WARNING: Do not run this script against production without explicit approval.");
  await ensureBaseSeed();

  const oldTxCount = await prisma.transaction.count({
    where: { createdAt: { lt: new Date(Date.now() - HISTORY_MARKER_DAYS * 86400000) } },
  });
  if (oldTxCount >= HISTORY_MIN_OLD_TX) {
    console.log(`Seed history: skipped (found ${oldTxCount} transactions older than ${HISTORY_MARKER_DAYS} days).`);
    return;
  }

  await ensureSettingsForSeed();
  await ensurePins();
  const u = await getUsers();
  const { byNum } = await getAccounts();

  const admin = u.admin!;
  const staff1 = u.staff1!;
  const c1 = u.c1!; const c2 = u.c2!; const c3 = u.c3!; const c4 = u.c4!;
  const c5 = u.c5!; const c6 = u.c6!; const c7 = u.c7!; const c8 = u.c8!;

  const a101 = byNum["100000000101"];
  const a201 = byNum["100000000201"];
  const a301 = byNum["100000000301"];
  const a401 = byNum["100000000401"];
  const a501 = byNum["100000000501"];
  const a601 = byNum["100000000601"];
  const a701 = byNum["100000000701"];
  const a801 = byNum["100000000801"];

  if (!a101 || !a201 || !a301 || !a401 || !a501 || !a601 || !a701 || !a801) {
    throw new Error("Expected seed accounts missing. Run base seed first.");
  }

  // Month-by-month deposits/withdrawals/transfers to create 12 months history
  const monthPlan = [
    { m: 11, dep: [["101","120000"],["201","90000"],["301","60000"],["401","150000"],["501","80000"],["601","45000"],["701","110000"],["801","70000"]], wd: [["101","15000"],["201","10000"],["401","20000"]], tr: [["101","102","10000"]] },
    { m: 10, dep: [["101","95000"],["202","70000"],["301","65000"],["402","120000"],["501","75000"],["702","85000"]], wd: [["101","12000"],["301","8000"],["501","5000"]], tr: [["201","202","15000"]] },
    { m: 9,  dep: [["102","130000"],["201","85000"],["401","140000"],["601","50000"],["801","90000"]], wd: [["201","18000"],["401","25000"],["801","10000"]], tr: [["401","402","20000"]] },
    { m: 8,  dep: [["101","110000"],["301","72000"],["501","88000"],["701","100000"],["402","95000"]], wd: [["101","20000"],["501","12000"]], tr: [["701","702","12000"]] },
    { m: 7,  dep: [["201","98000"],["401","160000"],["601","55000"],["801","76000"],["102","105000"]], wd: [["401","30000"],["601","7000"],["801","9000"]], tr: [["101","103","18000"]] },
    { m: 6,  dep: [["101","125000"],["301","68000"],["501","92000"],["701","115000"],["202","80000"]], wd: [["101","22000"],["301","15000"],["701","18000"]], tr: [["501","101","10000"]] },
    { m: 5,  dep: [["201","102000"],["402","130000"],["601","58000"],["801","82000"],["101","90000"]], wd: [["201","14000"],["402","16000"]], tr: [["201","301","8000"]] },
    { m: 4,  dep: [["101","140000"],["301","75000"],["401","155000"],["501","97000"],["702","89000"]], wd: [["101","25000"],["401","22000"],["501","11000"]], tr: [["401","501","12000"]] },
    { m: 3,  dep: [["201","108000"],["601","62000"],["801","86000"],["102","115000"],["402","125000"]], wd: [["201","17000"],["601","9000"]], tr: [["701","801","15000"]] },
    { m: 2,  dep: [["101","135000"],["301","78000"],["501","99000"],["701","120000"],["202","84000"]], wd: [["101","28000"],["301","12000"],["501","14000"]], tr: [["101","201","9000"]] },
    { m: 1,  dep: [["201","112000"],["401","165000"],["601","64000"],["801","91000"],["102","118000"]], wd: [["401","26000"],["801","13000"]], tr: [["401","701","11000"]] },
    { m: 0,  dep: [["101","145000"],["301","82000"],["501","103000"],["701","125000"],["402","135000"]], wd: [["101","30000"],["501","15000"],["701","20000"]], tr: [["101","102","7000"],["201","202","5000"]] },
  ] as const;

  const acct = (suffix: string) => byNum[`100000000${suffix}`];
  const owner = (suffix: string) => {
    const m: Record<string, { id: string; role: Role }> = {
      "101": c1, "102": c1, "103": c1, "201": c2, "202": c2, "301": c3,
      "401": c4, "402": c4, "501": c5, "601": c6, "701": c7, "702": c7, "801": c8, "802": c8,
    };
    return m[suffix];
  };

  let op = 0;
  for (const month of monthPlan) {
    for (const [suffix, amount] of month.dep) {
      op++;
      const at = monthsAgo(month.m, 5 + (op % 20), 10 + (op % 8));
      const a = acct(suffix)!;
      const c = owner(suffix);
      await deposit(admin, c, a.id, amount, at, `[HISTORY] Monthly deposit ${month.m}m ago`);
    }
    for (const [suffix, amount] of month.wd) {
      op++;
      const at = monthsAgo(month.m, 18 + (op % 8), 9 + (op % 8));
      const a = acct(suffix)!;
      const c = owner(suffix);
      await withdraw(admin, c, a.id, amount, at, `[HISTORY] Monthly withdrawal ${month.m}m ago`);
    }
    for (const [fromS, toS, amount] of month.tr) {
      op++;
      const at = monthsAgo(month.m, 12 + (op % 10), 11 + (op % 6));
      const fromA = acct(fromS)!;
      const toA = acct(toS)!;
      const fromC = owner(fromS);
      await doTransfer(fromC, fromA.id, toA.accountNumber, amount, at, `[HISTORY] Transfer ${month.m}m ago`, `seed-hist-tr-${month.m}-${fromS}-${toS}-${op}`);
    }
  }

  // Loans with different statuses
  // PENDING
  const loanPending = await applyLoan(prisma, { id: c3.id, role: c3.role }, {
    type: LoanType.PERSONAL,
    requestedAmount: "150000",
    durationMonths: 12,
    monthlyIncome: "60000",
    employmentStatus: EmploymentStatus.BUSINESS_OWNER,
    description: "[HISTORY] Personal loan pending",
    disbursementAccountId: a301.id,
  });
  await prisma.$executeRaw`UPDATE "Loan" SET "appliedAt" = ${monthsAgo(1, 8)} WHERE "id" = ${loanPending.id}`;

  // UNDER_REVIEW
  const loanReview = await applyLoan(prisma, { id: c6.id, role: c6.role }, {
    type: LoanType.EDUCATION,
    requestedAmount: "80000",
    durationMonths: 12,
    monthlyIncome: "30000",
    employmentStatus: EmploymentStatus.STUDENT,
    description: "[HISTORY] Education loan under review",
    disbursementAccountId: a601.id,
  });
  await forwardLoan(prisma, { id: staff1.id, role: staff1.role }, loanReview.id, "Forwarded for review");
  await prisma.$executeRaw`UPDATE "Loan" SET "appliedAt" = ${monthsAgo(2, 5)}, "reviewedAt" = ${monthsAgo(2, 6)} WHERE "id" = ${loanReview.id}`;

  // REJECTED
  const loanRejected = await applyLoan(prisma, { id: c8.id, role: c8.role }, {
    type: LoanType.BUSINESS,
    requestedAmount: "500000",
    durationMonths: 24,
    monthlyIncome: "35000",
    employmentStatus: EmploymentStatus.SELF_EMPLOYED,
    description: "[HISTORY] Business loan rejected",
    disbursementAccountId: a801.id,
  });
  await rejectLoan(prisma, { id: admin.id, role: admin.role }, loanRejected.id, "Insufficient income for requested amount.");
  await prisma.$executeRaw`UPDATE "Loan" SET "appliedAt" = ${monthsAgo(3, 11)}, "reviewedAt" = ${monthsAgo(3, 12)} WHERE "id" = ${loanRejected.id}`;

  // ACTIVE - approved and disbursed
  const loanActive = await applyLoan(prisma, { id: c2.id, role: c2.role }, {
    type: LoanType.HOME,
    requestedAmount: "300000",
    durationMonths: 12,
    monthlyIncome: "90000",
    employmentStatus: EmploymentStatus.EMPLOYED,
    description: "[HISTORY] Home loan active",
    disbursementAccountId: a201.id,
  });
  await approveLoan(prisma, { id: admin.id, role: admin.role }, loanActive.id, { disbursementAccountId: a201.id });
  await patchLoanTime(loanActive.id, monthsAgo(6, 10));
  await patchInstallmentDue(loanActive.id);
  // Backdate disbursement tx
  const activeLoanFull = await prisma.loan.findUnique({ where: { id: loanActive.id }, select: { disbursementTxId: true } });
  if (activeLoanFull?.disbursementTxId) await patchTxTime(activeLoanFull.disbursementTxId, monthsAgo(6, 10));
  // Pay 2 installments
  const insts = await prisma.loanInstallment.findMany({ where: { loanId: loanActive.id }, orderBy: { number: "asc" } });
  if (insts[0]) {
    await payLoanInstallment(prisma, { id: c2.id, role: c2.role }, loanActive.id, insts[0].id);
    const p = await prisma.loanInstallment.findUnique({ where: { id: insts[0].id }, select: { paymentTxId: true } });
    if (p?.paymentTxId) await patchTxTime(p.paymentTxId, monthsAgo(5, 12));
    await prisma.$executeRaw`UPDATE "LoanInstallment" SET "paidAt" = ${monthsAgo(5, 12)} WHERE "id" = ${insts[0].id}`;
  }
  if (insts[1]) {
    await payLoanInstallment(prisma, { id: c2.id, role: c2.role }, loanActive.id, insts[1].id);
    const p = await prisma.loanInstallment.findUnique({ where: { id: insts[1].id }, select: { paymentTxId: true } });
    if (p?.paymentTxId) await patchTxTime(p.paymentTxId, monthsAgo(4, 12));
    await prisma.$executeRaw`UPDATE "LoanInstallment" SET "paidAt" = ${monthsAgo(4, 12)} WHERE "id" = ${insts[1].id}`;
  }

  // COMPLETED loan
  const loanCompleted = await applyLoan(prisma, { id: c5.id, role: c5.role }, {
    type: LoanType.PERSONAL,
    requestedAmount: "50000",
    durationMonths: 3,
    monthlyIncome: "70000",
    employmentStatus: EmploymentStatus.EMPLOYED,
    description: "[HISTORY] Personal loan completed",
    disbursementAccountId: a501.id,
  });
  await approveLoan(prisma, { id: admin.id, role: admin.role }, loanCompleted.id, { disbursementAccountId: a501.id });
  await patchLoanTime(loanCompleted.id, monthsAgo(8, 10));
  const compFull = await prisma.loan.findUnique({ where: { id: loanCompleted.id }, select: { disbursementTxId: true } });
  if (compFull?.disbursementTxId) await patchTxTime(compFull.disbursementTxId, monthsAgo(8, 10));
  const compInsts = await prisma.loanInstallment.findMany({ where: { loanId: loanCompleted.id }, orderBy: { number: "asc" } });
  for (let i = 0; i < compInsts.length; i++) {
    await payLoanInstallment(prisma, { id: c5.id, role: c5.role }, loanCompleted.id, compInsts[i].id);
    const paid = await prisma.loanInstallment.findUnique({ where: { id: compInsts[i].id }, select: { paymentTxId: true } });
    const at = monthsAgo(7 - i, 15);
    if (paid?.paymentTxId) await patchTxTime(paid.paymentTxId, at);
    await prisma.$executeRaw`UPDATE "LoanInstallment" SET "paidAt" = ${at} WHERE "id" = ${compInsts[i].id}`;
  }
  await prisma.$executeRaw`UPDATE "Loan" SET "completedAt" = ${monthsAgo(4, 20)} WHERE "id" = ${loanCompleted.id}`;

  // Suspicious flags
  const recentTx = await prisma.transaction.findMany({
    where: { status: "COMPLETED", type: { in: ["TRANSFER", "WITHDRAWAL"] } },
    orderBy: { createdAt: "desc" },
    take: 4,
    select: { id: true, createdAt: true },
  });
  if (recentTx[0]) {
    const f = await flagTransaction(prisma, { id: staff1.id, role: staff1.role }, recentTx[0].id, "Unusual transfer amount pattern");
    await patchFlagTime(f.id, monthsAgo(1, 10));
  }
  if (recentTx[1]) {
    const f = await flagTransaction(prisma, { id: admin.id, role: admin.role }, recentTx[1].id, "Multiple rapid withdrawals");
    await resolveSuspiciousFlag(prisma, { id: admin.id, role: admin.role }, f.id, { status: "DISMISSED", resolutionNote: "Verified with customer" });
    await patchFlagTime(f.id, monthsAgo(2, 14));
  }
  if (recentTx[2]) {
    const f = await flagTransaction(prisma, { id: staff1.id, role: staff1.role }, recentTx[2].id, "High-value transfer to new recipient");
    await prisma.$executeRaw`UPDATE "SuspiciousFlag" SET "createdAt" = ${monthsAgo(0, 3)}, "resolvedAt" = NULL WHERE "id" = ${f.id}`;
  }

  await verifyInvariant();
  console.log("Seed history: completed.");
  console.log("Demo password for all seeded users:", DEMO_PASSWORD);
  console.log("Demo PIN set for all active customers:", DEMO_PIN);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
