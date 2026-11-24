import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  AccountStatus,
  AccountType,
  EntryDirection,
  FlagSource,
  FlagStatus,
  KycStatus,
  LoanStatus,
  LoanType,
  Prisma,
  RequestStatus,
  RequestType,
  Role,
  TxStatus,
  TxType,
  UserStatus,
} from "@prisma/client";
import { AppError } from "@/lib/errors";
import { freezeAccount, getAccountById, lookupAccountByNumber, unfreezeAccount, updateAccountLimits } from "@/lib/services/accountService";
import { updateCustomerStatus } from "@/lib/services/customerService";
import { approveLoan, getLoanById, rejectLoan } from "@/lib/services/loanService";
import { cancelRequest, getRequestById } from "@/lib/services/requestService";
import { resolveSuspiciousFlag } from "@/lib/services/suspiciousFlagService";
import { getTransactionById, reverseTransaction } from "@/lib/services/transactionService";
import { createTestPrisma, resetDb } from "../helpers/db";

const prisma = createTestPrisma();

async function createUser(email: string, role: Role = Role.CUSTOMER, status: UserStatus = UserStatus.ACTIVE) {
  return prisma.user.create({
    data: { email, name: email, passwordHash: "hash", role, status },
  });
}

async function createCustomerWithProfile(email: string) {
  return prisma.user.create({
    data: {
      email,
      name: email,
      passwordHash: "hash",
      role: Role.CUSTOMER,
      status: UserStatus.ACTIVE,
      profile: {
        create: {
          customerNo: `CUS-${Math.floor(Math.random() * 1_000_000).toString().padStart(6, "0")}`,
          nid: `NID-${Math.random().toString(36).slice(2, 12)}`,
          dateOfBirth: new Date("1990-01-01"),
          presentAddress: "Dhaka",
          kycStatus: KycStatus.VERIFIED,
        },
      },
    },
  });
}

async function createAccount(params: {
  ownerId?: string | null;
  number: string;
  balance?: string;
  type?: AccountType;
  status?: AccountStatus;
}) {
  return prisma.account.create({
    data: {
      accountNumber: params.number,
      ownerId: params.ownerId ?? null,
      type: params.type ?? AccountType.SAVINGS,
      status: params.status ?? AccountStatus.ACTIVE,
      balance: params.balance ?? "0.00",
    },
  });
}

async function createCompletedTransfer(fromId: string, toId: string, amount: string) {
  const from = await prisma.account.findUniqueOrThrow({ where: { id: fromId } });
  const to = await prisma.account.findUniqueOrThrow({ where: { id: toId } });
  const amt = Number(amount);
  const fromAfter = Number(from.balance.toString()) - amt;
  const toAfter = Number(to.balance.toString()) + amt;
  await prisma.account.update({ where: { id: fromId }, data: { balance: fromAfter.toFixed(2) } });
  await prisma.account.update({ where: { id: toId }, data: { balance: toAfter.toFixed(2) } });
  const tx = await prisma.transaction.create({
    data: {
      reference: `TXN-TEST-${Math.random().toString(36).slice(2, 10)}`,
      type: TxType.TRANSFER,
      status: TxStatus.COMPLETED,
      fromAccountId: fromId,
      toAccountId: toId,
      amount,
      fee: "0.00",
      currency: "BDT",
      completedAt: new Date(),
    },
  });
  await prisma.ledgerEntry.createMany({
    data: [
      { transactionId: tx.id, accountId: fromId, direction: EntryDirection.DEBIT, amount: amt.toFixed(2), balanceAfter: fromAfter.toFixed(2) },
      { transactionId: tx.id, accountId: toId, direction: EntryDirection.CREDIT, amount: amt.toFixed(2), balanceAfter: toAfter.toFixed(2) },
    ],
  });
  return tx;
}

async function createPendingLoan(applicantId: string, disbursementAccountId: string) {
  return prisma.loan.create({
    data: {
      loanNo: `LN-TEST-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      applicantId,
      type: LoanType.PERSONAL,
      requestedAmount: new Prisma.Decimal("10000.00"),
      durationMonths: 12,
      interestRate: new Prisma.Decimal("12.00"),
      monthlyIncome: new Prisma.Decimal("50000.00"),
      employmentStatus: "EMPLOYED",
      status: LoanStatus.PENDING,
      disbursementAccountId,
    },
  });
}

async function createPendingRequest(requesterId: string, accountId: string) {
  return prisma.depositWithdrawRequest.create({
    data: {
      type: RequestType.DEPOSIT,
      status: RequestStatus.PENDING,
      accountId,
      requesterId,
      amount: new Prisma.Decimal("100.00"),
    },
  });
}

async function createOpenFlag(txId: string, raisedById: string) {
  return prisma.suspiciousFlag.create({
    data: {
      transactionId: txId,
      raisedById,
      source: FlagSource.STAFF,
      reason: "Test flag",
      status: FlagStatus.OPEN,
    },
  });
}

function expectForbidden(e: unknown) {
  expect(e).toBeInstanceOf(AppError);
  expect((e as AppError).status).toBe(403);
  return true;
}

describe("authz matrix and ownership", () => {
  beforeAll(async () => {
    await prisma.$connect();
  });
  beforeEach(async () => {
    await resetDb(prisma);
  });
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("loan approve: STAFF/CUSTOMER forbidden, ADMIN succeeds", async () => {
    const admin = await createUser("admin@test.com", Role.ADMIN);
    const staff = await createUser("staff@test.com", Role.STAFF);
    const applicant = await createCustomerWithProfile("applicant@test.com");
    const disb = await createAccount({ ownerId: applicant.id, number: "100000000001", balance: "0.00" });
    await createAccount({ number: "000000000001", balance: "1000000.00", type: AccountType.SYSTEM });

    const loanForStaff = await createPendingLoan(applicant.id, disb.id);
    await expect(
      approveLoan(prisma, { id: staff.id, role: Role.STAFF }, loanForStaff.id, { disbursementAccountId: disb.id }),
    ).rejects.toSatisfy(expectForbidden);

    const loanForCustomer = await createPendingLoan(applicant.id, disb.id);
    await expect(
      approveLoan(prisma, { id: applicant.id, role: Role.CUSTOMER }, loanForCustomer.id, { disbursementAccountId: disb.id }),
    ).rejects.toSatisfy(expectForbidden);

    const loanForAdmin = await createPendingLoan(applicant.id, disb.id);
    const result = await approveLoan(
      prisma,
      { id: admin.id, role: Role.ADMIN },
      loanForAdmin.id,
      { disbursementAccountId: disb.id },
    );
    expect(result.loan.status).toBe(LoanStatus.ACTIVE);
  });

  it("loan reject: STAFF/CUSTOMER forbidden, ADMIN succeeds", async () => {
    const admin = await createUser("admin@test.com", Role.ADMIN);
    const staff = await createUser("staff@test.com", Role.STAFF);
    const applicant = await createCustomerWithProfile("applicant@test.com");
    const disb = await createAccount({ ownerId: applicant.id, number: "100000000011", balance: "0.00" });

    const loanForStaff = await createPendingLoan(applicant.id, disb.id);
    await expect(
      rejectLoan(prisma, { id: staff.id, role: Role.STAFF }, loanForStaff.id, "Not eligible"),
    ).rejects.toSatisfy(expectForbidden);

    const loanForCustomer = await createPendingLoan(applicant.id, disb.id);
    await expect(
      rejectLoan(prisma, { id: applicant.id, role: Role.CUSTOMER }, loanForCustomer.id, "Not eligible"),
    ).rejects.toSatisfy(expectForbidden);

    const loanForAdmin = await createPendingLoan(applicant.id, disb.id);
    const rejected = await rejectLoan(
      prisma,
      { id: admin.id, role: Role.ADMIN },
      loanForAdmin.id,
      "Not eligible",
    );
    expect(rejected.status).toBe(LoanStatus.REJECTED);
  });

  it("account freeze/unfreeze/limits: STAFF/CUSTOMER forbidden, ADMIN succeeds", async () => {
    const admin = await createUser("admin@test.com", Role.ADMIN);
    const staff = await createUser("staff@test.com", Role.STAFF);
    const customer = await createCustomerWithProfile("customer@test.com");
    const acc = await createAccount({ ownerId: customer.id, number: "100000000021", balance: "100.00" });

    await expect(freezeAccount(prisma, { id: staff.id, role: Role.STAFF }, acc.id, "Risk")).rejects.toSatisfy(expectForbidden);
    await expect(freezeAccount(prisma, { id: customer.id, role: Role.CUSTOMER }, acc.id, "Risk")).rejects.toSatisfy(expectForbidden);
    const frozen = await freezeAccount(prisma, { id: admin.id, role: Role.ADMIN }, acc.id, "Risk");
    expect(frozen.status).toBe(AccountStatus.FROZEN);

    await expect(unfreezeAccount(prisma, { id: staff.id, role: Role.STAFF }, acc.id)).rejects.toSatisfy(expectForbidden);
    await expect(unfreezeAccount(prisma, { id: customer.id, role: Role.CUSTOMER }, acc.id)).rejects.toSatisfy(expectForbidden);
    const unfrozen = await unfreezeAccount(prisma, { id: admin.id, role: Role.ADMIN }, acc.id);
    expect(unfrozen.status).toBe(AccountStatus.ACTIVE);

    await expect(
      updateAccountLimits(prisma, { id: staff.id, role: Role.STAFF }, acc.id, { perTxLimit: "1000.00" }),
    ).rejects.toSatisfy(expectForbidden);
    await expect(
      updateAccountLimits(prisma, { id: customer.id, role: Role.CUSTOMER }, acc.id, { perTxLimit: "1000.00" }),
    ).rejects.toSatisfy(expectForbidden);
    const limited = await updateAccountLimits(
      prisma,
      { id: admin.id, role: Role.ADMIN },
      acc.id,
      { perTxLimit: "1000.00" },
    );
    expect(limited.perTxLimit?.toFixed(2)).toBe("1000.00");
  });

  it("customer status: STAFF/CUSTOMER forbidden, ADMIN succeeds", async () => {
    const admin = await createUser("admin@test.com", Role.ADMIN);
    const staff = await createUser("staff@test.com", Role.STAFF);
    const customer = await createCustomerWithProfile("customer@test.com");

    await expect(
      updateCustomerStatus(prisma, { id: staff.id, role: Role.STAFF }, customer.id, UserStatus.BLOCKED),
    ).rejects.toSatisfy(expectForbidden);
    await expect(
      updateCustomerStatus(prisma, { id: customer.id, role: Role.CUSTOMER }, customer.id, UserStatus.BLOCKED),
    ).rejects.toSatisfy(expectForbidden);

    const updated = await updateCustomerStatus(
      prisma,
      { id: admin.id, role: Role.ADMIN },
      customer.id,
      UserStatus.BLOCKED,
    );
    expect(updated.status).toBe(UserStatus.BLOCKED);
  });

  it("transaction reverse: STAFF/CUSTOMER forbidden, ADMIN succeeds", async () => {
    const admin = await createUser("admin@test.com", Role.ADMIN);
    const staff = await createUser("staff@test.com", Role.STAFF);
    const u1 = await createCustomerWithProfile("u1@test.com");
    const u2 = await createCustomerWithProfile("u2@test.com");
    const a1 = await createAccount({ ownerId: u1.id, number: "100000000031", balance: "1000.00" });
    const a2 = await createAccount({ ownerId: u2.id, number: "100000000032", balance: "1000.00" });
    await createAccount({ number: "000000000001", balance: "0.00", type: AccountType.SYSTEM });
    const tx = await createCompletedTransfer(a1.id, a2.id, "100.00");

    await expect(reverseTransaction(prisma, { id: staff.id, role: Role.STAFF }, tx.id)).rejects.toSatisfy(expectForbidden);
    await expect(reverseTransaction(prisma, { id: u1.id, role: Role.CUSTOMER }, tx.id)).rejects.toSatisfy(expectForbidden);

    const reversal = await reverseTransaction(prisma, { id: admin.id, role: Role.ADMIN }, tx.id);
    expect(reversal.reversalOfId).toBe(tx.id);
  });

  it("suspicious flag resolution: STAFF/CUSTOMER forbidden, ADMIN succeeds", async () => {
    const admin = await createUser("admin@test.com", Role.ADMIN);
    const staff = await createUser("staff@test.com", Role.STAFF);
    const u1 = await createCustomerWithProfile("u1@test.com");
    const u2 = await createCustomerWithProfile("u2@test.com");
    const a1 = await createAccount({ ownerId: u1.id, number: "100000000071", balance: "1000.00" });
    const a2 = await createAccount({ ownerId: u2.id, number: "100000000072", balance: "1000.00" });
    const tx = await createCompletedTransfer(a1.id, a2.id, "100.00");

    const flagForStaff = await createOpenFlag(tx.id, staff.id);
    await expect(
      resolveSuspiciousFlag(prisma, { id: staff.id, role: Role.STAFF }, flagForStaff.id, { status: FlagStatus.DISMISSED, resolutionNote: "ok" }),
    ).rejects.toSatisfy(expectForbidden);

    const flagForCustomer = await createOpenFlag(tx.id, staff.id);
    await expect(
      resolveSuspiciousFlag(prisma, { id: u1.id, role: Role.CUSTOMER }, flagForCustomer.id, { status: FlagStatus.DISMISSED, resolutionNote: "ok" }),
    ).rejects.toSatisfy(expectForbidden);

    const flagForAdmin = await createOpenFlag(tx.id, staff.id);
    const resolved = await resolveSuspiciousFlag(
      prisma,
      { id: admin.id, role: Role.ADMIN },
      flagForAdmin.id,
      { status: FlagStatus.DISMISSED, resolutionNote: "Verified" },
    );
    expect(resolved.status).toBe(FlagStatus.DISMISSED);
  });

  it("account details: STAFF can read; CUSTOMER cannot read another customer's account", async () => {
    const staff = await createUser("staff@test.com", Role.STAFF);
    const owner = await createCustomerWithProfile("owner@test.com");
    const other = await createCustomerWithProfile("other@test.com");
    const acc = await createAccount({ ownerId: owner.id, number: "100000000081", balance: "500.00" });

    const staffView = await getAccountById(prisma, { id: staff.id, role: Role.STAFF }, acc.id);
    expect(staffView.id).toBe(acc.id);

    await expect(getAccountById(prisma, { id: other.id, role: Role.CUSTOMER }, acc.id)).rejects.toSatisfy(
      (e: unknown) => e instanceof AppError && [403, 404].includes(e.status),
    );
  });

  it("customer cannot read another customer's account, transaction, loan, or request", async () => {
    const owner = await createCustomerWithProfile("owner@test.com");
    const other = await createCustomerWithProfile("other@test.com");
    const ownerAcc = await createAccount({ ownerId: owner.id, number: "100000000041", balance: "500.00" });
    const otherAcc = await createAccount({ ownerId: other.id, number: "100000000042", balance: "500.00" });
    const tx = await createCompletedTransfer(ownerAcc.id, otherAcc.id, "50.00");
    const loan = await createPendingLoan(owner.id, ownerAcc.id);
    const req = await createPendingRequest(owner.id, ownerAcc.id);

    await expect(getTransactionById(prisma, { id: other.id, role: Role.CUSTOMER }, tx.id)).rejects.toSatisfy((e: unknown) => e instanceof AppError && [403, 404].includes(e.status));
    await expect(getLoanById(prisma, { id: other.id, role: Role.CUSTOMER }, loan.id)).rejects.toSatisfy((e: unknown) => e instanceof AppError && [403, 404].includes(e.status));
    await expect(getRequestById(prisma, { id: other.id, role: Role.CUSTOMER }, req.id)).rejects.toSatisfy((e: unknown) => e instanceof AppError && [403, 404].includes(e.status));

    // account read - accountService.getAccountById should deny/404 for non-owner customer
    const { getAccountById } = await import("@/lib/services/accountService");
    await expect(getAccountById(prisma, { id: other.id, role: Role.CUSTOMER }, ownerAcc.id)).rejects.toSatisfy((e: unknown) => e instanceof AppError && [403, 404].includes(e.status));
  });

  it("account lookup does not expose balance/private data and allows transfer-needed fields", async () => {
    const owner = await createCustomerWithProfile("owner@test.com");
    const other = await createCustomerWithProfile("other@test.com");
    await createAccount({ ownerId: owner.id, number: "100000000051", balance: "9999.00" });

    const result = await lookupAccountByNumber(prisma, { id: other.id, role: Role.CUSTOMER }, "100000000051");
    expect(result).toMatchObject({
      accountNumber: "100000000051",
      status: AccountStatus.ACTIVE,
    });
    expect(result).toHaveProperty("owner.name");
    expect(result).not.toHaveProperty("balance");
    expect(result).not.toHaveProperty("ownerId");
    expect(result).not.toHaveProperty("dailyTransferLimit");
    expect(result).not.toHaveProperty("perTxLimit");
  });

  it("customer cannot cancel another customer's request", async () => {
    const owner = await createCustomerWithProfile("owner@test.com");
    const other = await createCustomerWithProfile("other@test.com");
    const ownerAcc = await createAccount({ ownerId: owner.id, number: "100000000061", balance: "500.00" });
    const req = await createPendingRequest(owner.id, ownerAcc.id);

    await expect(cancelRequest(prisma, { id: other.id, role: Role.CUSTOMER }, req.id)).rejects.toSatisfy(
      (e: unknown) => e instanceof AppError && [403, 404].includes(e.status),
    );
  });
});
