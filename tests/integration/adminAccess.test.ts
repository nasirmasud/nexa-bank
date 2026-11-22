import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
const findUniqueMock = vi.fn();

vi.mock("@/lib/auth", () => ({ auth: authMock }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: findUniqueMock },
    auditLog: { count: vi.fn().mockResolvedValue(0), findMany: vi.fn().mockResolvedValue([]) },
  },
}));

describe("admin-only access", () => {
  beforeEach(() => {
    authMock.mockReset();
    findUniqueMock.mockReset();
  });

  it("returns 401 when unauthenticated", async () => {
    authMock.mockResolvedValue(null);
    const { GET } = await import("@/app/api/admin/audit-logs/route");
    const res = await GET(new Request("http://localhost/api/admin/audit-logs"));
    expect(res.status).toBe(401);
  });

  it("returns 403 for staff on admin-only endpoint", async () => {
    authMock.mockResolvedValue({
      user: { id: "staff-1", role: "STAFF", email: "s@test.com", name: "Staff" },
    });
    findUniqueMock.mockResolvedValue({ status: "ACTIVE", sessionVersion: 0, role: "STAFF" });
    const { GET } = await import("@/app/api/admin/audit-logs/route");
    const res = await GET(new Request("http://localhost/api/admin/audit-logs"));
    expect(res.status).toBe(403);
  });

  it("allows admin on admin-only endpoint", async () => {
    authMock.mockResolvedValue({
      user: { id: "admin-1", role: "ADMIN", email: "a@test.com", name: "Admin" },
    });
    findUniqueMock.mockResolvedValue({ status: "ACTIVE", sessionVersion: 0, role: "ADMIN" });
    const { GET } = await import("@/app/api/admin/audit-logs/route");
    const res = await GET(new Request("http://localhost/api/admin/audit-logs"));
    expect(res.status).toBe(200);
  });
});
