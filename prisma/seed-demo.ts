import {
  AccountType,
  EmploymentStatus,
  FlagStatus,
  KycStatus,
  LoanType,
  Prisma,
  PrismaClient,
  RequestType,
  Role,
  UserStatus,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import { DEMO_PASSWORD, DEMO_PIN } from "../src/lib/demo-credentials";
import { freezeAccount } from "../src/lib/services/accountService";
import { updateCustomerKyc, updateCustomerStatus } from "../src/lib/services/customerService";
import {
  applyLoan,
  approveLoan,
  forwardLoan,
  payLoanInstallment,
  rejectLoan,
} from "../src/lib/services/loanService";
import { approveRequest, createRequest, rejectRequest } from "../src/lib/services/requestService";
import { resolveSuspiciousFlag } from "../src/lib/services/suspiciousFlagService";
import { flagTransaction } from "../src/lib/services/transactionService";
import { transfer } from "../src/lib/services/transferService";

const prisma = new PrismaClient();

const MARKER = "[SEED_DEMO]";

type Actor = { id: string; role: Role };
type Acct = { id: string; accountNumber: string; ownerId: string | null };

function monthsAgo(months: number, day = 15, hour = 10) {
  const d = new Date();
  d.setUTCMonth(d.getUTCMonth() - months, day);
  d.setUTCHours(hour, (months * 7) % 60, 0, 0);
  return d;
}

function seasonal(monthsAgoIdx: number) {
  // realistic seasonal shape: higher around 11,7,3,0 months ago; lower around 9,5,1
  const wave = [1.15, 0.9, 1.05, 1.25, 0.95, 1.1, 1.2, 0.85, 1.0, 1.3, 0.92, 1.18];
  return wave[monthsAgoIdx] ?? 1;
}

async function ensureBase() {
  const admin = await prisma.user.findUnique({ where: { email: "admin@nexabank.com" } });
  const system = await prisma.account.findFirst({ where: { type: AccountType.SYSTEM } });
  if (!admin || !system) throw new Error("Base seed missing. Run `npm run db:seed` first.");
}

async function isSeeded() {
  const old = await prisma.transaction.count({ where: { description: { contains: MARKER } } });
  return old > 0;
}

async function ensurePinAndSettings() {
  const pinHash = await bcrypt.hash(DEMO_PIN, 10);
  await prisma.user.updateMany({
    where: { role: Role.CUSTOMER, status: UserStatus.ACTIVE },
    data: { pinHash, pinFailedCount: 0, pinLockedUntil: null },
  });
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

async function getCtx() {
  const users = await prisma.user.findMany({
    where: { role: { in: [Role.ADMIN, Role.STAFF, Role.CUSTOMER] } },
    select: { id: true, email: true, role: true },
  });
  const byEmail = Object.fromEntries(users.map((u) => [u.email, u]));
  const accounts = await prisma.account.findMany({
    where: { type: { not: AccountType.SYSTEM } },
    select: { id: true, accountNumber: true, ownerId: true },
  });
  const byNum = Object.fromEntries(accounts.map((a) => [a.accountNumber, a]));
  const byOwner = accounts.reduce<Record<string, Acct[]>>((acc, a) => {
    if (!a.ownerId) return acc;
    acc[a.ownerId] ??= [];
    acc[a.ownerId].push(a);
    return acc;
  }, {});
  return { byEmail, byNum, byOwner };
}

async function dep(admin: Actor, customer: Actor, accountId: string, amount: string, at: Date, desc: string) {
  const req = await createRequest(prisma, customer, { type: RequestType.DEPOSIT, accountId, amount, description: `${MARKER} ${desc}` }, { occurredAt: at });
  await approveRequest(prisma, admin, req.id, { occurredAt: at });
}

async function wd(admin: Actor, customer: Actor, accountId: string, amount: string, at: Date, desc: string) {
  const req = await createRequest(prisma, customer, { type: RequestType.WITHDRAWAL, accountId, amount, description: `${MARKER} ${desc}` }, { occurredAt: at });
  await approveRequest(prisma, admin, req.id, { occurredAt: at });
}

async function wdReject(staff: Actor, customer: Actor, accountId: string, amount: string, at: Date, desc: string, reason: string) {
  const req = await createRequest(prisma, customer, { type: RequestType.WITHDRAWAL, accountId, amount, description: `${MARKER} ${desc}` }, { occurredAt: at });
  await rejectRequest(prisma, staff, req.id, reason, { occurredAt: at });
}

async function tr(from: Actor, fromAccountId: string, toAccountNumber: string, amount: string, at: Date, desc: string, key: string) {
  await transfer(prisma, from, { fromAccountId, toAccountNumber, amount, pin: DEMO_PIN, description: `${MARKER} ${desc}`, idempotencyKey: key }, { occurredAt: at });
}

async function verifyInvariant() {
  const accounts = await prisma.account.findMany({ select: { id: true, accountNumber: true, balance: true } });
  const balanceSum = accounts.reduce((acc, a) => acc.add(new Prisma.Decimal(a.balance.toString())), new Prisma.Decimal(0));
  const ledger = await prisma.ledgerEntry.groupBy({ by: ["direction"], _sum: { amount: true } });
  const debit = new Prisma.Decimal((ledger.find((l) => l.direction === "DEBIT")?._sum.amount ?? 0).toString());
  const credit = new Prisma.Decimal((ledger.find((l) => l.direction === "CREDIT")?._sum.amount ?? 0).toString());
  const mismatches: string[] = [];
  if (!debit.equals(credit)) mismatches.push(`Ledger not balanced DEBIT=${debit} CREDIT=${credit}`);
  for (const a of accounts) {
    const last = await prisma.ledgerEntry.findFirst({ where: { accountId: a.id }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], select: { balanceAfter: true } });
    if (last && !new Prisma.Decimal(a.balance.toString()).equals(new Prisma.Decimal(last.balanceAfter.toString()))) {
      mismatches.push(`Account ${a.accountNumber} balance ${a.balance} != ledger ${last.balanceAfter}`);
    }
  }
  if (!balanceSum.equals(new Prisma.Decimal("100000000.00"))) mismatches.push(`Total balances ${balanceSum} != 100000000.00`);
  if (!credit.sub(debit).equals(0)) mismatches.push(`Ledger net ${credit.sub(debit)} != 0`);
  console.log(`Invariant: debit=${debit} credit=${credit} net=${credit.sub(debit)} totalBalances=${balanceSum}`);
  if (mismatches.length) throw new Error(`Invariant failed:\n${mismatches.join("\n")}`);
}

async function main() {
  console.log("seed:demo starting...");
  console.log("WARNING: Do not run against production without explicit approval.");
  await ensureBase();
  if (await isSeeded()) {
    console.log("seed:demo skipped: marker transactions already exist.");
    return;
  }
  await ensurePinAndSettings();
  const { byEmail, byNum } = await getCtx();

  const admin: Actor = { id: byEmail["admin@nexabank.com"].id, role: Role.ADMIN };
  const staff1: Actor = { id: byEmail["staff1@nexabank.com"].id, role: Role.STAFF };
  const staff2: Actor = { id: byEmail["staff2@nexabank.com"].id, role: Role.STAFF };
  const c = (email: string): Actor => ({ id: byEmail[email].id, role: Role.CUSTOMER });
  const c1 = c("customer1@nexabank.com"), c2 = c("customer2@nexabank.com"), c3 = c("customer3@nexabank.com"), c4 = c("customer4@nexabank.com");
  const c5 = c("customer5@nexabank.com"), c6 = c("customer6@nexabank.com"), c7 = c("customer7@nexabank.com"), c8 = c("customer8@nexabank.com");

  const a = (num: string) => byNum[num];
  const a101 = a("100000000101"), a102 = a("100000000102"), a103 = a("100000000103");
  const a201 = a("100000000201"), a202 = a("100000000202");
  const a301 = a("100000000301");
  const a401 = a("100000000401"), a402 = a("100000000402");
  const a501 = a("100000000501");
  const a601 = a("100000000601");
  const a701 = a("100000000701"), a702 = a("100000000702");
  const a801 = a("100000000801"), a802 = a("100000000802");

  // 12 months history with seasonal shape (all 8 customers active in the market)
  const plan = [
    { m: 11, deps: [[c1,a101,"120000"],[c2,a201,"90000"],[c3,a301,"65000"],[c4,a401,"150000"],[c5,a501,"80000"],[c6,a601,"50000"],[c7,a701,"110000"],[c8,a801,"70000"]] },
    { m: 10, deps: [[c1,a101,"85000"],[c2,a202,"70000"],[c3,a301,"55000"],[c4,a402,"120000"],[c5,a501,"75000"],[c7,a702,"85000"]] },
    { m: 9,  deps: [[c1,a102,"130000"],[c2,a201,"95000"],[c4,a401,"140000"],[c6,a601,"60000"],[c8,a801,"90000"]] },
    { m: 8,  deps: [[c1,a101,"140000"],[c3,a301,"80000"],[c5,a501,"98000"],[c7,a701,"120000"],[c4,a402,"105000"]] },
    { m: 7,  deps: [[c2,a201,"100000"],[c4,a401,"160000"],[c6,a601,"55000"],[c8,a801,"76000"],[c1,a102,"105000"]] },
    { m: 6,  deps: [[c1,a101,"125000"],[c3,a301,"78000"],[c5,a501,"92000"],[c7,a701,"115000"],[c2,a202,"88000"]] },
    { m: 5,  deps: [[c2,a201,"92000"],[c4,a402,"130000"],[c6,a601,"52000"],[c8,a801,"82000"],[c1,a101,"90000"]] },
    { m: 4,  deps: [[c1,a101,"150000"],[c3,a301,"85000"],[c4,a401,"165000"],[c5,a501,"97000"],[c7,a702,"99000"]] },
    { m: 3,  deps: [[c2,a201,"108000"],[c6,a601,"68000"],[c8,a801,"86000"],[c1,a102,"115000"],[c4,a402,"125000"]] },
    { m: 2,  deps: [[c1,a101,"135000"],[c3,a301,"72000"],[c5,a501,"89000"],[c7,a701,"120000"],[c2,a202,"84000"]] },
    { m: 1,  deps: [[c2,a201,"112000"],[c4,a401,"155000"],[c6,a601,"64000"],[c8,a801,"91000"],[c1,a102,"118000"]] },
    { m: 0,  deps: [[c1,a101,"160000"],[c3,a301,"92000"],[c5,a501,"110000"],[c7,a701,"135000"],[c4,a402,"145000"],[c2,a201,"120000"]] },
  ] as const;

  let op = 0;
  for (const row of plan) {
    const factor = seasonal(row.m);
    for (const [cust, acct, amt] of row.deps) {
      op++;
      const scaled = String(Math.round(Number(amt) * factor));
      await dep(admin, cust as Actor, (acct as Acct).id, scaled, monthsAgo(row.m, 3 + (op % 20), 9 + (op % 10)), `deposit m-${row.m}`);
    }
    // withdrawals (fewer, smaller)
    const wdTargets = row.deps.slice(0, row.m % 2 === 0 ? 3 : 2);
    for (const [cust, acct, amt] of wdTargets) {
      op++;
      const wAmt = String(Math.round(Number(amt) * 0.18 * factor));
      await wd(admin, cust as Actor, (acct as Acct).id, wAmt, monthsAgo(row.m, 20 + (op % 7), 13 + (op % 6)), `withdrawal m-${row.m}`);
    }
    // transfers
    const trPairs: Array<[Actor, Acct, Acct, string]> = [
      [c1, a101, a102, String(Math.round(12000 * factor))],
      [c2, a201, a202, String(Math.round(9000 * factor))],
      [c4, a401, a402, String(Math.round(15000 * factor))],
    ];
    for (let i = 0; i < (row.m % 3 === 0 ? 3 : 2); i++) {
      const [fromC, fromA, toA, amt] = trPairs[i];
      op++;
      await tr(fromC, fromA.id, toA.accountNumber, amt, monthsAgo(row.m, 12 + i * 3, 11 + (op % 5)), `transfer m-${row.m}`, `seed-demo-tr-${row.m}-${i}-${op}`);
    }
  }

  // extra customer1 activity (3 accounts, transfers to other seeded customers)
  await tr(c1, a101.id, a201.accountNumber, "8500", monthsAgo(2, 14, 14), "to Ayesha", "seed-demo-c1-ext-1");
  await tr(c1, a102.id, a301.accountNumber, "6500", monthsAgo(1, 18, 15), "to Tanvir", "seed-demo-c1-ext-2");
  await tr(c2, a201.id, a101.accountNumber, "5000", monthsAgo(1, 20, 16), "to Demo Customer", "seed-demo-c2-c1-1");

  // Customer1: 1 pending deposit request and 1 rejected withdrawal request
  await createRequest(prisma, c1, { type: RequestType.DEPOSIT, accountId: a101.id, amount: "25000", description: `${MARKER} Pending deposit request` }, { occurredAt: monthsAgo(0, 2, 9) });
  await wdReject(staff1, c1, a103.id, "40000", monthsAgo(0, 5, 10), "Rejected withdrawal request", "Insufficient supporting documentation.");

  // Staff: 3-4 pending deposit/withdrawal requests
  await createRequest(prisma, c2, { type: RequestType.DEPOSIT, accountId: a201.id, amount: "18000", description: `${MARKER} Staff pending deposit` }, { occurredAt: monthsAgo(0, 3, 9) });
  await createRequest(prisma, c4, { type: RequestType.WITHDRAWAL, accountId: a401.id, amount: "22000", description: `${MARKER} Staff pending withdrawal` }, { occurredAt: monthsAgo(0, 3, 11) });
  await createRequest(prisma, c5, { type: RequestType.DEPOSIT, accountId: a501.id, amount: "30000", description: `${MARKER} Staff pending deposit 2` }, { occurredAt: monthsAgo(0, 4, 10) });
  await createRequest(prisma, c7, { type: RequestType.WITHDRAWAL, accountId: a701.id, amount: "15000", description: `${MARKER} Staff pending withdrawal 2` }, { occurredAt: monthsAgo(0, 4, 12) });

  // Staff: 2-3 customers with KYC pending
  await updateCustomerKyc(prisma, staff1, c3.id, KycStatus.PENDING, { occurredAt: monthsAgo(0, 6) });
  await updateCustomerKyc(prisma, staff1, c6.id, KycStatus.PENDING, { occurredAt: monthsAgo(0, 6) });
  await updateCustomerKyc(prisma, staff2, c8.id, KycStatus.PENDING, { occurredAt: monthsAgo(0, 7) });

  // Loans: all statuses
  // Pending
  await applyLoan(prisma, c3, { type: LoanType.PERSONAL, requestedAmount: "150000", durationMonths: 12, monthlyIncome: "60000", employmentStatus: EmploymentStatus.BUSINESS_OWNER, description: `${MARKER} Pending loan`, disbursementAccountId: a301.id }, { occurredAt: monthsAgo(0, 6) });
  // Under Review with internal note
  const loanReview = await applyLoan(prisma, c6, { type: LoanType.EDUCATION, requestedAmount: "80000", durationMonths: 12, monthlyIncome: "30000", employmentStatus: EmploymentStatus.STUDENT, description: `${MARKER} Under review loan`, disbursementAccountId: a601.id }, { occurredAt: monthsAgo(0, 8) });
  await forwardLoan(prisma, staff1, loanReview.id, "Internal note: verify enrollment documents before approval.", { occurredAt: monthsAgo(0, 7) });
  // Approved/Active with part installments paid (customer1)
  const loanActive = await applyLoan(prisma, c1, { type: LoanType.HOME, requestedAmount: "300000", durationMonths: 12, monthlyIncome: "120000", employmentStatus: EmploymentStatus.EMPLOYED, description: `${MARKER} Active loan`, disbursementAccountId: a101.id }, { occurredAt: monthsAgo(6, 10) });
  await approveLoan(prisma, admin, loanActive.id, { disbursementAccountId: a101.id }, { occurredAt: monthsAgo(6, 9) });
  const activeInst = await prisma.loanInstallment.findMany({ where: { loanId: loanActive.id }, orderBy: { number: "asc" } });
  for (let i = 0; i < Math.min(3, activeInst.length); i++) {
    await payLoanInstallment(prisma, c1, loanActive.id, activeInst[i].id, { occurredAt: monthsAgo(5 - i, 12) });
  }
  // Rejected
  const loanRejected = await applyLoan(prisma, c8, { type: LoanType.BUSINESS, requestedAmount: "500000", durationMonths: 24, monthlyIncome: "35000", employmentStatus: EmploymentStatus.SELF_EMPLOYED, description: `${MARKER} Rejected loan`, disbursementAccountId: a801.id }, { occurredAt: monthsAgo(3, 11) });
  await rejectLoan(prisma, admin, loanRejected.id, "Insufficient income for requested amount.", { occurredAt: monthsAgo(3, 10) });
  // Completed
  const loanCompleted = await applyLoan(prisma, c5, { type: LoanType.PERSONAL, requestedAmount: "50000", durationMonths: 3, monthlyIncome: "70000", employmentStatus: EmploymentStatus.EMPLOYED, description: `${MARKER} Completed loan`, disbursementAccountId: a501.id }, { occurredAt: monthsAgo(8, 10) });
  await approveLoan(prisma, admin, loanCompleted.id, { disbursementAccountId: a501.id }, { occurredAt: monthsAgo(8, 9) });
  const compInst = await prisma.loanInstallment.findMany({ where: { loanId: loanCompleted.id }, orderBy: { number: "asc" } });
  for (let i = 0; i < compInst.length; i++) {
    await payLoanInstallment(prisma, c5, loanCompleted.id, compInst[i].id, { occurredAt: monthsAgo(7 - i, 15) });
  }

  // Suspicious flags: 2 open, 1 dismissed, 1 escalated
  const flagTx = await prisma.transaction.findMany({ where: { status: "COMPLETED", type: { in: ["TRANSFER", "WITHDRAWAL"] } }, orderBy: { createdAt: "desc" }, take: 6, select: { id: true } });
  if (flagTx[0]) await flagTransaction(prisma, staff1, flagTx[0].id, "Unusual transfer pattern", { occurredAt: monthsAgo(0, 2) });
  if (flagTx[1]) await flagTransaction(prisma, staff2, flagTx[1].id, "Rapid withdrawal activity", { occurredAt: monthsAgo(0, 3) });
  if (flagTx[2]) { const f = await flagTransaction(prisma, staff1, flagTx[2].id, "High-value transfer to new recipient", { occurredAt: monthsAgo(1, 5) }); await resolveSuspiciousFlag(prisma, admin, f.id, { status: FlagStatus.DISMISSED, resolutionNote: "Verified with customer." }, { occurredAt: monthsAgo(1, 4) }); }
  if (flagTx[3]) { const f = await flagTransaction(prisma, staff2, flagTx[3].id, "Repeated failed-like behavior pattern", { occurredAt: monthsAgo(2, 7) }); await resolveSuspiciousFlag(prisma, admin, f.id, { status: FlagStatus.ESCALATED, resolutionNote: "Escalated for compliance review." }, { occurredAt: monthsAgo(2, 6) }); }

  // Frozen/blocked accounts
  await freezeAccount(prisma, admin, a601.id, "Suspicious activity review", { occurredAt: monthsAgo(0, 9) });
  await freezeAccount(prisma, admin, a802.id, "Customer request pending verification", { occurredAt: monthsAgo(0, 8) });
  // blocked customer
  await updateCustomerStatus(prisma, admin, c8.id, UserStatus.BLOCKED, { occurredAt: monthsAgo(0, 10) });
  // ensure c8 still has KYC pending as requested? staff KYC pending was set above for c8; blocked is ok for management screens

  await verifyInvariant();

  const [txCount, reqCount, loanCount, flagCount, notifCount, auditCount, accountCount, userCount] = await Promise.all([
    prisma.transaction.count(),
    prisma.depositWithdrawRequest.count(),
    prisma.loan.count(),
    prisma.suspiciousFlag.count(),
    prisma.notification.count(),
    prisma.auditLog.count(),
    prisma.account.count(),
    prisma.user.count(),
  ]);
  console.log("seed:demo summary");
  console.table({ users: userCount, accounts: accountCount, transactions: txCount, requests: reqCount, loans: loanCount, flags: flagCount, notifications: notifCount, auditLogs: auditCount });
  console.log("Demo password:", DEMO_PASSWORD);
  console.log("Demo PIN:", DEMO_PIN);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
