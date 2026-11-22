import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { AccountStatus, AccountType, EntryDirection, Role, TxStatus, TxType, UserStatus } from "@prisma/client";
import { createTestPrisma, resetDb } from "../helpers/db";
import { AppError } from "@/lib/errors";
import { getTransactionById, listTransactions, reverseTransaction } from "@/lib/services/transactionService";

const prisma = createTestPrisma();

async function createUser(email: string, role: Role = Role.CUSTOMER) {
  return prisma.user.create({ data: { email, name: email, passwordHash: "hash", role, status: UserStatus.ACTIVE } });
}

async function createAccount(params: { ownerId?: string | null; number: string; balance?: string; type?: AccountType; status?: AccountStatus }) {
  return prisma.account.create({
    data: { accountNumber: params.number, ownerId: params.ownerId ?? null, type: params.type ?? AccountType.SAVINGS, status: params.status ?? AccountStatus.ACTIVE, balance: params.balance ?? "0.00" },
  });
}

async function createCompletedTransfer(fromId: string, toId: string, amount: string, fee = "0.00") {
  const from = await prisma.account.findUniqueOrThrow({ where: { id: fromId } });
  const to = await prisma.account.findUniqueOrThrow({ where: { id: toId } });
  const amt = Number(amount);
  const f = Number(fee);
  const fromAfter = Number(from.balance.toString()) - amt - f;
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
      fee,
      currency: "BDT",
      completedAt: new Date(),
    },
  });
  await prisma.ledgerEntry.createMany({
    data: [
      { transactionId: tx.id, accountId: fromId, direction: EntryDirection.DEBIT, amount: (amt + f).toFixed(2), balanceAfter: fromAfter.toFixed(2) },
      { transactionId: tx.id, accountId: toId, direction: EntryDirection.CREDIT, amount: amt.toFixed(2), balanceAfter: toAfter.toFixed(2) },
    ],
  });
  return tx;
}

describe("transactionService", () => {
  beforeAll(async () => { await prisma.$connect(); });
  beforeEach(async () => { await resetDb(prisma); });
  afterAll(async () => { await prisma.$disconnect(); });

  it("lists transactions scoped to customer and supports filters", async () => {
    const u1 = await createUser("u1@test.com");
    const u2 = await createUser("u2@test.com");
    const a1 = await createAccount({ ownerId: u1.id, number: "100000000001", balance: "1000.00" });
    const a2 = await createAccount({ ownerId: u2.id, number: "100000000002", balance: "1000.00" });
    const a3 = await createAccount({ ownerId: u2.id, number: "100000000003", balance: "1000.00" });

    await createCompletedTransfer(a1.id, a2.id, "10.00");
    await createCompletedTransfer(a2.id, a3.id, "20.00");

    const res = await listTransactions(prisma, { id: u1.id, role: Role.CUSTOMER }, { page: 1, pageSize: 10 });
    expect(res.pagination.total).toBe(1);
    expect(res.items[0].amount.toFixed(2)).toBe("10.00");
  });

  it("returns 404 for foreign transaction detail", async () => {
    const u1 = await createUser("u1@test.com");
    const u2 = await createUser("u2@test.com");
    const u3 = await createUser("u3@test.com");
    const a1 = await createAccount({ ownerId: u1.id, number: "100000000001", balance: "1000.00" });
    const a2 = await createAccount({ ownerId: u2.id, number: "100000000002", balance: "1000.00" });
    const tx = await createCompletedTransfer(a1.id, a2.id, "10.00");

    await expect(getTransactionById(prisma, { id: u3.id, role: Role.CUSTOMER }, tx.id))
      .rejects.toSatisfy((e: unknown) => e instanceof AppError && e.status === 404);
  });

  it("reverses a completed transfer and blocks double reversal / insufficient receiver funds", async () => {
    const admin = await createUser("admin@test.com", Role.ADMIN);
    const u1 = await createUser("u1@test.com");
    const u2 = await createUser("u2@test.com");
    const a1 = await createAccount({ ownerId: u1.id, number: "100000000001", balance: "1000.00" });
    const a2 = await createAccount({ ownerId: u2.id, number: "100000000002", balance: "10.00" });
    await createAccount({ number: "000000000001", balance: "0.00", type: AccountType.SYSTEM });

    const tx = await createCompletedTransfer(a1.id, a2.id, "100.00", "0.00");

    const reversal = await reverseTransaction(prisma, { id: admin.id, role: Role.ADMIN }, tx.id);
    expect(reversal.reversalOfId).toBe(tx.id);

    const orig = await prisma.transaction.findUniqueOrThrow({ where: { id: tx.id } });
    expect(orig.status).toBe(TxStatus.REVERSED);
    const a1After = await prisma.account.findUniqueOrThrow({ where: { id: a1.id } });
    const a2After = await prisma.account.findUniqueOrThrow({ where: { id: a2.id } });
    expect(a1After.balance.toFixed(2)).toBe("1000.00");
    expect(a2After.balance.toFixed(2)).toBe("10.00");

    await expect(reverseTransaction(prisma, { id: admin.id, role: Role.ADMIN }, tx.id))
      .rejects.toMatchObject({ code: "VALIDATION_ERROR" });

    // insufficient receiver funds case
    const a3 = await createAccount({ ownerId: u1.id, number: "100000000003", balance: "1000.00" });
    const a4 = await createAccount({ ownerId: u2.id, number: "100000000004", balance: "0.00" });
    const tx2 = await prisma.transaction.create({
      data: { reference: "TXN-TEST-NOFUNDS", type: TxType.TRANSFER, status: TxStatus.COMPLETED, fromAccountId: a3.id, toAccountId: a4.id, amount: "100.00", fee: "0.00", currency: "BDT", completedAt: new Date() },
    });
    await expect(reverseTransaction(prisma, { id: admin.id, role: Role.ADMIN }, tx2.id))
      .rejects.toMatchObject({ code: "INSUFFICIENT_FUNDS" });
  });
});
