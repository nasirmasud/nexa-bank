import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  AccountType,
  EmploymentStatus,
  LoanStatus,
  LoanType,
  RequestStatus,
  RequestType,
  Role,
  TxStatus,
  TxType,
  UserStatus,
} from "@prisma/client";
import { createTestPrisma, resetDb } from "../helpers/db";
import { getAdminAnalytics } from "@/lib/services/analyticsService";

const prisma = createTestPrisma();

async function seedBasic() {
  const admin = await prisma.user.create({
    data: {
      email: "admin@test.com",
      name: "Admin",
      passwordHash: "hash",
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
    },
  });
  const customer = await prisma.user.create({
    data: {
      email: "c@test.com",
      name: "Cust",
      passwordHash: "hash",
      role: Role.CUSTOMER,
      status: UserStatus.ACTIVE,
    },
  });
  const acct = await prisma.account.create({
    data: {
      accountNumber: "100000000001",
      ownerId: customer.id,
      type: AccountType.SAVINGS,
      status: "ACTIVE",
      balance: "500.00",
    },
  });
  await prisma.transaction.create({
    data: {
      reference: "TXN-1",
      type: TxType.DEPOSIT,
      status: TxStatus.COMPLETED,
      toAccountId: acct.id,
      amount: "100.00",
      fee: "0.00",
      initiatedById: admin.id,
      completedAt: new Date(),
    },
  });
  await prisma.loan.create({
    data: {
      loanNo: "LN-1",
      applicantId: customer.id,
      type: LoanType.PERSONAL,
      requestedAmount: "1000.00",
      durationMonths: 12,
      interestRate: "12.00",
      monthlyIncome: "5000.00",
      employmentStatus: EmploymentStatus.EMPLOYED,
      status: LoanStatus.PENDING,
      disbursementAccountId: acct.id,
    },
  });
  await prisma.depositWithdrawRequest.create({
    data: {
      requesterId: customer.id,
      accountId: acct.id,
      type: RequestType.DEPOSIT,
      amount: "50.00",
      status: RequestStatus.PENDING,
    },
  });
  await prisma.suspiciousFlag.create({
    data: {
      transactionId: (await prisma.transaction.findFirstOrThrow()).id,
      source: "STAFF",
      reason: "test",
      status: "OPEN",
    },
  });
  return { admin };
}

describe("analyticsService", () => {
  beforeAll(async () => {
    await prisma.$connect();
  });
  beforeEach(async () => {
    await resetDb(prisma);
  });
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("returns analytics summary for admin", async () => {
    const { admin } = await seedBasic();
    const data = await getAdminAnalytics(prisma, { id: admin.id, role: Role.ADMIN });

    expect(data.kpis.totalCustomers).toBe(1);
    expect(data.kpis.totalAccounts).toBe(1);
    expect(data.kpis.pendingLoans).toBe(1);
    expect(data.kpis.pendingRequests).toBe(1);
    expect(data.kpis.openFlags).toBe(1);
    expect(Array.isArray(data.monthlyVolume)).toBe(true);
    expect(Array.isArray(data.accountDistribution)).toBe(true);
  });

  it("forbids staff", async () => {
    await seedBasic();
    await expect(getAdminAnalytics(prisma, { id: "s1", role: Role.STAFF })).rejects.toMatchObject({
      status: 403,
    });
  });
});
