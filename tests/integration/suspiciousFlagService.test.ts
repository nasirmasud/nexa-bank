import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  AccountType,
  FlagSource,
  FlagStatus,
  Role,
  TxStatus,
  TxType,
  UserStatus,
} from "@prisma/client";
import { createTestPrisma, resetDb } from "../helpers/db";
import { listSuspiciousFlags, resolveSuspiciousFlag } from "@/lib/services/suspiciousFlagService";

const prisma = createTestPrisma();

async function seed() {
  const admin = await prisma.user.create({
    data: {
      email: "a@test.com",
      name: "Admin",
      passwordHash: "h",
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
    },
  });
  const staff = await prisma.user.create({
    data: {
      email: "s@test.com",
      name: "Staff",
      passwordHash: "h",
      role: Role.STAFF,
      status: UserStatus.ACTIVE,
    },
  });
  const customer = await prisma.user.create({
    data: {
      email: "c@test.com",
      name: "Cust",
      passwordHash: "h",
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
      balance: "0.00",
    },
  });
  const tx = await prisma.transaction.create({
    data: {
      reference: "TXN-1",
      type: TxType.DEPOSIT,
      status: TxStatus.COMPLETED,
      toAccountId: acct.id,
      amount: "100.00",
      fee: "0.00",
    },
  });
  const flag = await prisma.suspiciousFlag.create({
    data: {
      transactionId: tx.id,
      source: FlagSource.STAFF,
      reason: "Odd pattern",
      status: FlagStatus.OPEN,
      raisedById: staff.id,
    },
  });
  return { admin, staff, customer, flag };
}

describe("suspiciousFlagService", () => {
  beforeAll(async () => {
    await prisma.$connect();
  });
  beforeEach(async () => {
    await resetDb(prisma);
  });
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("lists flags for staff and forbids customer", async () => {
    const { staff, customer } = await seed();
    const res = await listSuspiciousFlags(
      prisma,
      { id: staff.id, role: Role.STAFF },
      { page: 1, pageSize: 10 },
    );
    expect(res.pagination.total).toBe(1);
    await expect(
      listSuspiciousFlags(
        prisma,
        { id: customer.id, role: Role.CUSTOMER },
        { page: 1, pageSize: 10 },
      ),
    ).rejects.toMatchObject({ status: 403 });
  });

  it("resolves open flag and blocks second resolution", async () => {
    const { admin, flag } = await seed();
    const resolved = await resolveSuspiciousFlag(
      prisma,
      { id: admin.id, role: Role.ADMIN },
      flag.id,
      { status: FlagStatus.DISMISSED, resolutionNote: "False positive" },
    );
    expect(resolved.status).toBe(FlagStatus.DISMISSED);
    expect(resolved.resolutionNote).toBe("False positive");
    await expect(
      resolveSuspiciousFlag(prisma, { id: admin.id, role: Role.ADMIN }, flag.id, {
        status: FlagStatus.ESCALATED,
        resolutionNote: "Again",
      }),
    ).rejects.toMatchObject({ status: 422 });
  });
});
