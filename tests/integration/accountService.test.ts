import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { AccountStatus, AccountType, Role, UserStatus } from "@prisma/client";
import { createTestPrisma, resetDb } from "../helpers/db";
import {
  createAccount,
  freezeAccount,
  getAccountById,
  listAccounts,
  lookupAccountByNumber,
  unfreezeAccount,
  updateAccountLimits,
} from "@/lib/services/accountService";
import { AppError } from "@/lib/errors";

const prisma = createTestPrisma();

async function createUser(params: { email: string; role: Role; name?: string }) {
  return prisma.user.create({
    data: {
      email: params.email,
      passwordHash: "test-hash",
      name: params.name ?? params.email,
      role: params.role,
      status: UserStatus.ACTIVE,
    },
  });
}

describe("accountService", () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  beforeEach(async () => {
    await resetDb(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("creates an account for an active customer", async () => {
    const admin = await createUser({ email: "admin@test.com", role: Role.ADMIN });
    const customer = await createUser({ email: "cust@test.com", role: Role.CUSTOMER });

    const account = await createAccount(prisma, { id: admin.id, role: Role.ADMIN }, {
      ownerId: customer.id,
      type: AccountType.SAVINGS,
      nickname: "Main",
      dailyTransferLimit: "50000.00",
      perTxLimit: "10000.00",
      minBalance: "500.00",
    });

    expect(account.ownerId).toBe(customer.id);
    expect(account.type).toBe(AccountType.SAVINGS);
    expect(account.status).toBe(AccountStatus.ACTIVE);
    expect(account.accountNumber).toMatch(/^\d{12}$/);
    expect(account.nickname).toBe("Main");
    expect(account.dailyTransferLimit?.toFixed(2)).toBe("50000.00");
  });

  it("lists accounts with pagination and owner scoping for customer", async () => {
    const admin = await createUser({ email: "admin@test.com", role: Role.ADMIN });
    const c1 = await createUser({ email: "c1@test.com", role: Role.CUSTOMER });
    const c2 = await createUser({ email: "c2@test.com", role: Role.CUSTOMER });

    await createAccount(prisma, { id: admin.id, role: Role.ADMIN }, { ownerId: c1.id, type: AccountType.SAVINGS });
    await createAccount(prisma, { id: admin.id, role: Role.ADMIN }, { ownerId: c1.id, type: AccountType.CURRENT });
    await createAccount(prisma, { id: admin.id, role: Role.ADMIN }, { ownerId: c2.id, type: AccountType.SAVINGS });

    const result = await listAccounts(prisma, { id: c1.id, role: Role.CUSTOMER }, { page: 1, pageSize: 10 });
    expect(result.pagination.total).toBe(2);
    expect(result.items).toHaveLength(2);
    expect(result.items.every((a) => a.ownerId === c1.id)).toBe(true);
  });

  it("lookups account by number and hides ownership details appropriately", async () => {
    const admin = await createUser({ email: "admin@test.com", role: Role.ADMIN });
    const customer = await createUser({ email: "cust@test.com", role: Role.CUSTOMER, name: "Alice" });
    const account = await createAccount(prisma, { id: admin.id, role: Role.ADMIN }, {
      ownerId: customer.id,
      type: AccountType.SAVINGS,
    });

    const found = await lookupAccountByNumber(prisma, { id: admin.id, role: Role.ADMIN }, account.accountNumber);
    expect(found.accountNumber).toBe(account.accountNumber);
    expect(found.owner?.name).toBe("Alice");
  });

  it("returns 404 for foreign account access by customer", async () => {
    const admin = await createUser({ email: "admin@test.com", role: Role.ADMIN });
    const c1 = await createUser({ email: "c1@test.com", role: Role.CUSTOMER });
    const c2 = await createUser({ email: "c2@test.com", role: Role.CUSTOMER });
    const account = await createAccount(prisma, { id: admin.id, role: Role.ADMIN }, { ownerId: c1.id, type: AccountType.SAVINGS });

    await expect(getAccountById(prisma, { id: c2.id, role: Role.CUSTOMER }, account.id)).rejects.toSatisfy((e: unknown) => {
      return e instanceof AppError && e.code === "NOT_FOUND" && e.status === 404;
    });
  });

  it("freezes and unfreezes account", async () => {
    const admin = await createUser({ email: "admin@test.com", role: Role.ADMIN });
    const customer = await createUser({ email: "cust@test.com", role: Role.CUSTOMER });
    const account = await createAccount(prisma, { id: admin.id, role: Role.ADMIN }, { ownerId: customer.id, type: AccountType.SAVINGS });

    const frozen = await freezeAccount(prisma, { id: admin.id, role: Role.ADMIN }, account.id, "Suspicious activity");
    expect(frozen.status).toBe(AccountStatus.FROZEN);
    expect(frozen.freezeReason).toBe("Suspicious activity");

    const active = await unfreezeAccount(prisma, { id: admin.id, role: Role.ADMIN }, account.id);
    expect(active.status).toBe(AccountStatus.ACTIVE);
    expect(active.freezeReason).toBeNull();
  });

  it("updates account limits", async () => {
    const admin = await createUser({ email: "admin@test.com", role: Role.ADMIN });
    const customer = await createUser({ email: "cust@test.com", role: Role.CUSTOMER });
    const account = await createAccount(prisma, { id: admin.id, role: Role.ADMIN }, { ownerId: customer.id, type: AccountType.SAVINGS });

    const updated = await updateAccountLimits(prisma, { id: admin.id, role: Role.ADMIN }, account.id, {
      dailyTransferLimit: "25000.00",
      perTxLimit: null,
    });
    expect(updated.dailyTransferLimit?.toFixed(2)).toBe("25000.00");
    expect(updated.perTxLimit).toBeNull();
  });

  it("forbids customer from creating/freezing/updating limits", async () => {
    const admin = await createUser({ email: "admin@test.com", role: Role.ADMIN });
    const customer = await createUser({ email: "cust@test.com", role: Role.CUSTOMER });
    const account = await createAccount(prisma, { id: admin.id, role: Role.ADMIN }, { ownerId: customer.id, type: AccountType.SAVINGS });
    const actor = { id: customer.id, role: Role.CUSTOMER };

    await expect(createAccount(prisma, actor, { ownerId: customer.id, type: AccountType.SAVINGS })).rejects.toMatchObject({ status: 403 });
    await expect(freezeAccount(prisma, actor, account.id, "x".repeat(3))).rejects.toMatchObject({ status: 403 });
    await expect(updateAccountLimits(prisma, actor, account.id, { dailyTransferLimit: "1.00" })).rejects.toMatchObject({ status: 403 });
  });
});
