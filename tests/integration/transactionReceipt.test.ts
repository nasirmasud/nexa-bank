import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/guards", () => ({
  requireAuth: vi
    .fn()
    .mockResolvedValue({ id: "u1", role: "CUSTOMER", email: "c@test.com", name: "C" }),
}));
vi.mock("@/lib/services/transactionService", () => ({
  getTransactionById: vi.fn().mockResolvedValue({
    id: "tx1",
    reference: "TXN-123",
    type: "TRANSFER",
    status: "COMPLETED",
    amount: "100.00",
    fee: "1.00",
    currency: "BDT",
    description: "Test",
    createdAt: new Date("2026-01-01T00:00:00Z"),
    completedAt: new Date("2026-01-01T00:00:00Z"),
    fromAccount: { accountNumber: "123456789012" },
    toAccount: { accountNumber: "987654321098" },
  }),
}));
vi.mock("@/lib/prisma", () => ({ prisma: {} }));

describe("transaction receipt", () => {
  it("returns a pdf response", async () => {
    const { GET } = await import("@/app/api/transactions/[id]/receipt/route");
    const res = await GET(new Request("http://localhost/api/transactions/tx1/receipt"), {
      params: Promise.resolve({ id: "tx1" }),
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("application/pdf");
    expect(res.headers.get("content-disposition")).toContain("receipt-TXN-123.pdf");
    const buf = Buffer.from(await res.arrayBuffer());
    expect(buf.length).toBeGreaterThan(100);
    expect(buf.subarray(0, 4).toString()).toBe("%PDF");
  });
});
