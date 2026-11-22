import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/guards", () => ({
  requireAuth: vi
    .fn()
    .mockResolvedValue({ id: "u1", role: "CUSTOMER", email: "c@test.com", name: "C" }),
}));
vi.mock("@/lib/services/accountService", () => ({
  getAccountStatement: vi.fn().mockResolvedValue({
    account: { id: "a1", accountNumber: "123456789012" },
    from: null,
    to: null,
    transactions: [
      {
        id: "t1",
        reference: "TXN-1",
        type: "DEPOSIT",
        status: "COMPLETED",
        amount: "100.00",
        fee: "0.00",
        currency: "BDT",
        description: "Test",
        createdAt: new Date("2026-01-01T00:00:00Z"),
        completedAt: new Date("2026-01-01T00:00:00Z"),
        fromAccountId: null,
        toAccountId: "a1",
      },
    ],
  }),
}));
vi.mock("@/lib/prisma", () => ({ prisma: {} }));

describe("account statement", () => {
  it("returns csv", async () => {
    const { GET } = await import("@/app/api/accounts/[id]/statement/route");
    const res = await GET(new Request("http://localhost/api/accounts/a1/statement?format=csv"), {
      params: Promise.resolve({ id: "a1" }),
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/csv");
    const text = await res.text();
    expect(text).toContain("reference,type,status");
    expect(text).toContain("TXN-1");
  });

  it("returns pdf", async () => {
    const { GET } = await import("@/app/api/accounts/[id]/statement/route");
    const res = await GET(new Request("http://localhost/api/accounts/a1/statement?format=pdf"), {
      params: Promise.resolve({ id: "a1" }),
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("application/pdf");
    const buf = Buffer.from(await res.arrayBuffer());
    expect(buf.subarray(0, 4).toString()).toBe("%PDF");
  });
});
