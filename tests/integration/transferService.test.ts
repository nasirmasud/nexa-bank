import bcrypt from "bcryptjs";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { AccountStatus, AccountType, Role, TxStatus, UserStatus } from "@prisma/client";
import { createTestPrisma, resetDb } from "../helpers/db";
import { transfer } from "@/lib/services/transferService";
import { AppError } from "@/lib/errors";

const prisma = createTestPrisma();
const PIN = "123456";

async function seedSettings(overrides: Partial<{ dailyTransferLimit: string; maxSingleTransaction: string; minAccountBalance: string; transferFeePercent: string; minTransferFee: string }> = {}) {
  await prisma.settings.create({
    data: {
      id: 1,
      dailyTransferLimit: overrides.dailyTransferLimit ?? "200000",
      maxSingleTransaction: overrides.maxSingleTransaction ?? "100000",
      minAccountBalance: overrides.minAccountBalance ?? "0",
      transferFeePercent: overrides.transferFeePercent ?? "0.50",
      minTransferFee: overrides.minTransferFee ?? "5",
      loanInterestRates: { PERSONAL: 12, EDUCATION: 8, BUSINESS: 14, HOME: 10 },
    },
  });
}

async function createUser(email: string, role: Role = Role.CUSTOMER) {
  return prisma.user.create({
    data: {
      email,
      name: email,
      passwordHash: "hash",
      pinHash: await bcrypt.hash(PIN, 4),
      role,
      status: UserStatus.ACTIVE,
    },
  });
}

async function createAccount(params: { ownerId?: string | null; number: string; balance: string; type?: AccountType; status?: AccountStatus; dailyTransferLimit?: string | null; perTxLimit?: string | null; minBalance?: string | null }) {
  return prisma.account.create({
    data: {
      accountNumber: params.number,
      ownerId: params.ownerId ?? null,
      type: params.type ?? AccountType.SAVINGS,
      status: params.status ?? AccountStatus.ACTIVE,
      balance: params.balance,
      dailyTransferLimit: params.dailyTransferLimit ?? undefined,
      perTxLimit: params.perTxLimit ?? undefined,
      minBalance: params.minBalance ?? undefined,
    },
  });
}

describe("transferService", () => {
  beforeAll(async () => {
    await prisma.$connect();
  });
  beforeEach(async () => {
    await resetDb(prisma);
    await seedSettings();
    await createAccount({ number: "000000000001", balance: "0", type: AccountType.SYSTEM });
  });
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("transfers successfully and records tx/ledger/notifications", async () => {
    const u1 = await createUser("u1@test.com");
    const u2 = await createUser("u2@test.com");
    const from = await createAccount({ ownerId: u1.id, number: "100000000001", balance: "1000.00" });
    const to = await createAccount({ ownerId: u2.id, number: "100000000002", balance: "200.00" });

    const res = await transfer(prisma, { id: u1.id, role: Role.CUSTOMER }, {
      fromAccountId: from.id,
      toAccountNumber: to.accountNumber,
      amount: "100.00",
      pin: PIN,
      idempotencyKey: "k1",
      description: "test",
    });

    expect(res.transaction.status).toBe(TxStatus.COMPLETED);
    expect(res.transaction.amount.toFixed(2)).toBe("100.00");
    expect(res.fromAccount.balance.toFixed(2)).toBe("895.00");

    const fromDb = await prisma.account.findUniqueOrThrow({ where: { id: from.id } });
    const toDb = await prisma.account.findUniqueOrThrow({ where: { id: to.id } });
    expect(fromDb.balance.toFixed(2)).toBe("895.00");
    expect(toDb.balance.toFixed(2)).toBe("300.00");

    const tx = await prisma.transaction.findUniqueOrThrow({ where: { id: res.transaction.id }, include: { ledger: true } });
    expect(tx.fee.toFixed(2)).toBe("5.00");
    expect(tx.ledger.length).toBeGreaterThanOrEqual(2);

    const notifications = await prisma.notification.findMany();
    expect(notifications.length).toBe(2);
  });

  it("rejects insufficient funds", async () => {
    const u1 = await createUser("u1@test.com");
    const u2 = await createUser("u2@test.com");
    const from = await createAccount({ ownerId: u1.id, number: "100000000001", balance: "50.00" });
    const to = await createAccount({ ownerId: u2.id, number: "100000000002", balance: "0.00" });

    await expect(transfer(prisma, { id: u1.id, role: Role.CUSTOMER }, {
      fromAccountId: from.id, toAccountNumber: to.accountNumber, amount: "100.00", pin: PIN, idempotencyKey: "k1",
    })).rejects.toSatisfy((e: unknown) => e instanceof AppError && e.code === "INSUFFICIENT_FUNDS");
  });

  it("rejects frozen source account", async () => {
    const u1 = await createUser("u1@test.com");
    const u2 = await createUser("u2@test.com");
    const from = await createAccount({ ownerId: u1.id, number: "100000000001", balance: "1000.00", status: AccountStatus.FROZEN });
    const to = await createAccount({ ownerId: u2.id, number: "100000000002", balance: "0.00" });

    await expect(transfer(prisma, { id: u1.id, role: Role.CUSTOMER }, {
      fromAccountId: from.id, toAccountNumber: to.accountNumber, amount: "10.00", pin: PIN, idempotencyKey: "k1",
    })).rejects.toSatisfy((e: unknown) => e instanceof AppError && e.code === "ACCOUNT_FROZEN");
  });

  it("handles wrong PIN and lockout", async () => {
    const u1 = await createUser("u1@test.com");
    const u2 = await createUser("u2@test.com");
    const from = await createAccount({ ownerId: u1.id, number: "100000000001", balance: "1000.00" });
    const to = await createAccount({ ownerId: u2.id, number: "100000000002", balance: "0.00" });
    const input = { fromAccountId: from.id, toAccountNumber: to.accountNumber, amount: "10.00", pin: "000000", idempotencyKey: "k1" };

    await expect(transfer(prisma, { id: u1.id, role: Role.CUSTOMER }, input)).rejects.toMatchObject({ code: "INVALID_PIN" });
    await expect(transfer(prisma, { id: u1.id, role: Role.CUSTOMER }, { ...input, idempotencyKey: "k2" })).rejects.toMatchObject({ code: "INVALID_PIN" });
    await expect(transfer(prisma, { id: u1.id, role: Role.CUSTOMER }, { ...input, idempotencyKey: "k3" })).rejects.toMatchObject({ code: "PIN_LOCKED" });

    const user = await prisma.user.findUniqueOrThrow({ where: { id: u1.id } });
    expect(user.pinLockedUntil).not.toBeNull();
  });

  it("enforces per-tx and daily limits", async () => {
    await prisma.settings.update({
      where: { id: 1 },
      data: { maxSingleTransaction: "500", dailyTransferLimit: "600", minTransferFee: "0", transferFeePercent: "0" },
    });
    const u1 = await createUser("u1@test.com");
    const u2 = await createUser("u2@test.com");
    const from = await createAccount({ ownerId: u1.id, number: "100000000001", balance: "2000.00" });
    const to = await createAccount({ ownerId: u2.id, number: "100000000002", balance: "0.00" });

    await expect(transfer(prisma, { id: u1.id, role: Role.CUSTOMER }, {
      fromAccountId: from.id, toAccountNumber: to.accountNumber, amount: "501.00", pin: PIN, idempotencyKey: "k1",
    })).rejects.toMatchObject({ code: "LIMIT_EXCEEDED_SINGLE" });

    await transfer(prisma, { id: u1.id, role: Role.CUSTOMER }, {
      fromAccountId: from.id, toAccountNumber: to.accountNumber, amount: "400.00", pin: PIN, idempotencyKey: "k2",
    });
    await expect(transfer(prisma, { id: u1.id, role: Role.CUSTOMER }, {
      fromAccountId: from.id, toAccountNumber: to.accountNumber, amount: "250.00", pin: PIN, idempotencyKey: "k3",
    })).rejects.toMatchObject({ code: "LIMIT_EXCEEDED_DAILY" });
  });

  it("returns same result for duplicate idempotency key", async () => {
    const u1 = await createUser("u1@test.com");
    const u2 = await createUser("u2@test.com");
    const from = await createAccount({ ownerId: u1.id, number: "100000000001", balance: "1000.00" });
    const to = await createAccount({ ownerId: u2.id, number: "100000000002", balance: "0.00" });
    const input = { fromAccountId: from.id, toAccountNumber: to.accountNumber, amount: "10.00", pin: PIN, idempotencyKey: "same-key" };

    const r1 = await transfer(prisma, { id: u1.id, role: Role.CUSTOMER }, input);
    const r2 = await transfer(prisma, { id: u1.id, role: Role.CUSTOMER }, input);

    expect(r2.transaction.id).toBe(r1.transaction.id);
    const txCount = await prisma.transaction.count({ where: { type: "TRANSFER" } });
    expect(txCount).toBe(1);
  });

  it("keeps balance invariant under 20 concurrent transfers", async () => {
    await prisma.settings.update({
      where: { id: 1 },
      data: { maxSingleTransaction: "100000", dailyTransferLimit: "500000", minTransferFee: "0", transferFeePercent: "0" },
    });
    const u1 = await createUser("u1@test.com");
    const u2 = await createUser("u2@test.com");
    const a1 = await createAccount({ ownerId: u1.id, number: "100000000001", balance: "1000.00" });
    const a2 = await createAccount({ ownerId: u2.id, number: "100000000002", balance: "1000.00" });

    const ops = Array.from({ length: 20 }, (_, i) => {
      const fromAtoB = i % 2 === 0;
      return transfer(prisma, { id: fromAtoB ? u1.id : u2.id, role: Role.CUSTOMER }, {
        fromAccountId: fromAtoB ? a1.id : a2.id,
        toAccountNumber: fromAtoB ? a2.accountNumber : a1.accountNumber,
        amount: "10.00",
        pin: PIN,
        idempotencyKey: `conc-${i}`,
      }).then(() => "ok" as const).catch((e) => e);
    });

    const results = await Promise.all(ops);
    const failures = results.filter((r) => r !== "ok");
    // Some may fail due to serialization retries exhausted or transient issues; but no partial debits.
    expect(failures.length).toBeLessThan(20);

    const [b1, b2] = await Promise.all([
      prisma.account.findUniqueOrThrow({ where: { id: a1.id } }),
      prisma.account.findUniqueOrThrow({ where: { id: a2.id } }),
    ]);
    const total = Number(b1.balance.toString()) + Number(b2.balance.toString());
    expect(total).toBe(2000);
  });
});
