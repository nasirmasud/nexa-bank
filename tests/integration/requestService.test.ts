import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { AccountStatus, AccountType, RequestStatus, RequestType, Role, TxStatus, UserStatus } from "@prisma/client";
import { createTestPrisma, resetDb } from "../helpers/db";
import { AppError } from "@/lib/errors";
import { approveRequest, cancelRequest, createRequest, rejectRequest } from "@/lib/services/requestService";

const prisma = createTestPrisma();

async function createUser(email: string, role: Role = Role.CUSTOMER) {
  return prisma.user.create({
    data: { email, name: email, passwordHash: "hash", role, status: UserStatus.ACTIVE },
  });
}

async function createAccount(params: { ownerId?: string | null; number: string; balance?: string; type?: AccountType; status?: AccountStatus; minBalance?: string }) {
  return prisma.account.create({
    data: {
      accountNumber: params.number,
      ownerId: params.ownerId ?? null,
      type: params.type ?? AccountType.SAVINGS,
      status: params.status ?? AccountStatus.ACTIVE,
      balance: params.balance ?? "0.00",
      minBalance: params.minBalance,
    },
  });
}

describe("requestService", () => {
  beforeAll(async () => { await prisma.$connect(); });
  beforeEach(async () => {
    await resetDb(prisma);
    await createAccount({ number: "000000000001", balance: "100000.00", type: AccountType.SYSTEM });
  });
  afterAll(async () => { await prisma.$disconnect(); });

  it("creates and cancels a pending request for own account", async () => {
    const customer = await createUser("c@test.com");
    const account = await createAccount({ ownerId: customer.id, number: "100000000001", balance: "500.00" });

    const req = await createRequest(prisma, { id: customer.id, role: Role.CUSTOMER }, {
      type: RequestType.DEPOSIT, accountId: account.id, amount: "100.00", description: "topup",
    });
    expect(req.status).toBe(RequestStatus.PENDING);

    const cancelled = await cancelRequest(prisma, { id: customer.id, role: Role.CUSTOMER }, req.id);
    expect(cancelled.status).toBe(RequestStatus.CANCELLED);
  });

  it("approves deposit: credits account, debits system, creates tx/ledger/notification", async () => {
    const admin = await createUser("admin@test.com", Role.ADMIN);
    const customer = await createUser("c@test.com");
    const account = await createAccount({ ownerId: customer.id, number: "100000000002", balance: "500.00" });

    const req = await createRequest(prisma, { id: customer.id, role: Role.CUSTOMER }, {
      type: RequestType.DEPOSIT, accountId: account.id, amount: "200.00",
    });
    const approved = await approveRequest(prisma, { id: admin.id, role: Role.ADMIN }, req.id);
    expect(approved.status).toBe(RequestStatus.APPROVED);
    expect(approved.transaction?.status).toBe(TxStatus.COMPLETED);

    const acct = await prisma.account.findUniqueOrThrow({ where: { id: account.id } });
    expect(acct.balance.toFixed(2)).toBe("700.00");
    const tx = await prisma.transaction.findFirstOrThrow({ where: { requestId: req.id }, include: { ledger: true } });
    expect(tx.type).toBe("DEPOSIT");
    expect(tx.ledger).toHaveLength(2);
    const notifs = await prisma.notification.findMany({ where: { userId: customer.id } });
    expect(notifs.length).toBe(1);
  });

  it("approves withdrawal and rejects when insufficient funds", async () => {
    const admin = await createUser("admin@test.com", Role.ADMIN);
    const customer = await createUser("c@test.com");
    const account = await createAccount({ ownerId: customer.id, number: "100000000002", balance: "100.00" });

    const okReq = await createRequest(prisma, { id: customer.id, role: Role.CUSTOMER }, {
      type: RequestType.WITHDRAWAL, accountId: account.id, amount: "40.00",
    });
    const approved = await approveRequest(prisma, { id: admin.id, role: Role.ADMIN }, okReq.id);
    expect(approved.status).toBe(RequestStatus.APPROVED);
    const acct = await prisma.account.findUniqueOrThrow({ where: { id: account.id } });
    expect(acct.balance.toFixed(2)).toBe("60.00");

    const badReq = await createRequest(prisma, { id: customer.id, role: Role.CUSTOMER }, {
      type: RequestType.WITHDRAWAL, accountId: account.id, amount: "100.00",
    });
    await expect(approveRequest(prisma, { id: admin.id, role: Role.ADMIN }, badReq.id))
      .rejects.toSatisfy((e: unknown) => e instanceof AppError && e.code === "INSUFFICIENT_FUNDS");
  });

  it("rejects request with reason", async () => {
    const staff = await createUser("staff@test.com", Role.STAFF);
    const customer = await createUser("c@test.com");
    const account = await createAccount({ ownerId: customer.id, number: "100000000002", balance: "100.00" });

    const req = await createRequest(prisma, { id: customer.id, role: Role.CUSTOMER }, {
      type: RequestType.DEPOSIT, accountId: account.id, amount: "50.00",
    });

    const rejected = await rejectRequest(prisma, { id: staff.id, role: Role.STAFF }, req.id, "Invalid proof");
    expect(rejected.status).toBe(RequestStatus.REJECTED);
    expect(rejected.rejectionReason).toBe("Invalid proof");
  });

  it("blocks self-approval", async () => {
    const admin = await createUser("admin@test.com", Role.ADMIN);
    const account = await createAccount({ ownerId: admin.id, number: "100000000002", balance: "100.00" });
    // Create request directly to simulate self-requester edge case
    const req = await prisma.depositWithdrawRequest.create({
      data: { type: RequestType.DEPOSIT, accountId: account.id, requesterId: admin.id, amount: "50.00" },
    });

    await expect(approveRequest(prisma, { id: admin.id, role: Role.ADMIN }, req.id))
      .rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
