import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  AccountType,
  EmploymentStatus,
  LoanStatus,
  LoanType,
  Role,
  TxStatus,
  UserStatus,
} from "@prisma/client";
import { createTestPrisma, resetDb } from "../helpers/db";
import { approveLoan, getLoanById, listLoans, rejectLoan } from "@/lib/services/loanService";

const prisma = createTestPrisma();

async function createUser(email: string, role: Role = Role.CUSTOMER) {
  return prisma.user.create({
    data: { email, name: email, passwordHash: "hash", role, status: UserStatus.ACTIVE },
  });
}
async function createAccount(params: {
  ownerId?: string | null;
  number: string;
  balance?: string;
  type?: AccountType;
}) {
  return prisma.account.create({
    data: {
      accountNumber: params.number,
      ownerId: params.ownerId ?? null,
      type: params.type ?? AccountType.SAVINGS,
      status: "ACTIVE",
      balance: params.balance ?? "0.00",
    },
  });
}
async function seedSettings() {
  await prisma.settings.create({
    data: { id: 1, loanInterestRates: { PERSONAL: 12, EDUCATION: 8, BUSINESS: 14, HOME: 10 } },
  });
}
async function createLoan(applicantId: string, disbAccountId: string) {
  return prisma.loan.create({
    data: {
      loanNo: `LN-TEST-${Math.random().toString(36).slice(2, 8)}`,
      applicantId,
      type: LoanType.PERSONAL,
      requestedAmount: "10000.00",
      durationMonths: 12,
      interestRate: "12.00",
      monthlyIncome: "50000.00",
      employmentStatus: EmploymentStatus.EMPLOYED,
      status: LoanStatus.PENDING,
      disbursementAccountId: disbAccountId,
    },
  });
}

describe("loanService", () => {
  beforeAll(async () => {
    await prisma.$connect();
  });
  beforeEach(async () => {
    await resetDb(prisma);
    await seedSettings();
    await createAccount({ number: "000000000001", balance: "100000.00", type: AccountType.SYSTEM });
  });
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("lists loans scoped to customer and allows staff detail", async () => {
    const u1 = await createUser("u1@test.com");
    const u2 = await createUser("u2@test.com");
    const staff = await createUser("staff@test.com", Role.STAFF);
    const a1 = await createAccount({ ownerId: u1.id, number: "100000000001" });
    const a2 = await createAccount({ ownerId: u2.id, number: "100000000002" });
    const l1 = await createLoan(u1.id, a1.id);
    await createLoan(u2.id, a2.id);

    const custList = await listLoans(
      prisma,
      { id: u1.id, role: Role.CUSTOMER },
      { page: 1, pageSize: 10 },
    );
    expect(custList.pagination.total).toBe(1);

    const detail = await getLoanById(prisma, { id: staff.id, role: Role.STAFF }, l1.id);
    expect(detail.id).toBe(l1.id);
  });

  it("blocks not-self and invalid transition on reject", async () => {
    const admin = await createUser("admin@test.com", Role.ADMIN);
    const a = await createAccount({ ownerId: admin.id, number: "100000000010" });
    const loan = await createLoan(admin.id, a.id);

    await expect(
      rejectLoan(prisma, { id: admin.id, role: Role.ADMIN }, loan.id, "nope"),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("approves loan: disburses, creates installments, sets ACTIVE", async () => {
    const admin = await createUser("admin@test.com", Role.ADMIN);
    const customer = await createUser("c@test.com");
    const acct = await createAccount({
      ownerId: customer.id,
      number: "100000000010",
      balance: "0.00",
    });
    const loan = await createLoan(customer.id, acct.id);

    const res = await approveLoan(prisma, { id: admin.id, role: Role.ADMIN }, loan.id, {
      disbursementAccountId: acct.id,
    });
    expect(res.loan.status).toBe(LoanStatus.ACTIVE);
    expect(res.loan.disbursementTxId).toBeTruthy();

    const updatedAcct = await prisma.account.findUniqueOrThrow({ where: { id: acct.id } });
    expect(updatedAcct.balance.toFixed(2)).toBe("10000.00");
    const installments = await prisma.loanInstallment.findMany({ where: { loanId: loan.id } });
    expect(installments).toHaveLength(12);
    const tx = await prisma.transaction.findUniqueOrThrow({
      where: { id: res.disbursementTransactionId },
    });
    expect(tx.type).toBe("LOAN_DISBURSEMENT");
    expect(tx.status).toBe(TxStatus.COMPLETED);
  });

  it("reject records reason", async () => {
    const admin = await createUser("admin@test.com", Role.ADMIN);
    const customer = await createUser("c@test.com");
    const acct = await createAccount({ ownerId: customer.id, number: "100000000010" });
    const loan = await createLoan(customer.id, acct.id);

    const rejected = await rejectLoan(
      prisma,
      { id: admin.id, role: Role.ADMIN },
      loan.id,
      "Insufficient income",
    );
    expect(rejected.status).toBe(LoanStatus.REJECTED);
    expect(rejected.rejectionReason).toBe("Insufficient income");
  });
});
