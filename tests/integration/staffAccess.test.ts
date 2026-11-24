import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
const findUniqueMock = vi.fn();
const countMock = vi.fn();
const findManyMock = vi.fn();

vi.mock("@/lib/auth", () => ({ auth: authMock }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: findUniqueMock, count: countMock, findMany: findManyMock },
  },
}));

describe("staff admin access", () => {
  beforeEach(() => {
    authMock.mockReset();
    findUniqueMock.mockReset();
    countMock.mockReset();
    findManyMock.mockReset();
  });

  it("returns 403 for STAFF on staff routes", async () => {
    authMock.mockResolvedValue({
      user: { id: "staff-1", role: "STAFF", email: "s@test.com", name: "Staff", sessionVersion: 0 },
    });
    findUniqueMock.mockResolvedValue({ status: "ACTIVE", sessionVersion: 0, role: "STAFF" });
    const { GET } = await import("@/app/api/admin/staff/route");
    const res = await GET(new Request("http://localhost/api/admin/staff?page=1&pageSize=20"));
    expect(res.status).toBe(403);
  });

  it("returns 403 for CUSTOMER on staff routes", async () => {
    authMock.mockResolvedValue({
      user: { id: "cust-1", role: "CUSTOMER", email: "c@test.com", name: "Cust", sessionVersion: 0 },
    });
    findUniqueMock.mockResolvedValue({ status: "ACTIVE", sessionVersion: 0, role: "CUSTOMER" });
    const { GET } = await import("@/app/api/admin/staff/route");
    const res = await GET(new Request("http://localhost/api/admin/staff?page=1&pageSize=20"));
    expect(res.status).toBe(403);
  });

  it("rejects role field in create body (strict Zod)", async () => {
    authMock.mockResolvedValue({
      user: { id: "admin-1", role: "ADMIN", email: "a@test.com", name: "Admin", sessionVersion: 0 },
    });
    findUniqueMock.mockResolvedValue({ status: "ACTIVE", sessionVersion: 0, role: "ADMIN" });
    const { POST } = await import("@/app/api/admin/staff/route");
    const res = await POST(
      new Request("http://localhost/api/admin/staff", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: "Staff User",
          email: "staff@test.com",
          temporaryPassword: "TempPass@123",
          role: "ADMIN",
        }),
      }),
    );
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("rejects stale sessionVersion (old session cannot be used)", async () => {
    authMock.mockResolvedValue({
      user: { id: "staff-1", role: "STAFF", email: "s@test.com", name: "Staff", sessionVersion: 0 },
    });
    findUniqueMock.mockResolvedValue({ status: "ACTIVE", sessionVersion: 1, role: "STAFF" });
    const { GET } = await import("@/app/api/admin/staff/route");
    const res = await GET(new Request("http://localhost/api/admin/staff?page=1&pageSize=20"));
    expect(res.status).toBe(401);
  });

  it("returns 403 for STAFF/CUSTOMER on staff status route", async () => {
    authMock.mockResolvedValue({
      user: { id: "staff-1", role: "STAFF", email: "s@test.com", name: "Staff", sessionVersion: 0 },
    });
    findUniqueMock.mockResolvedValue({ status: "ACTIVE", sessionVersion: 0, role: "STAFF" });
    const { PATCH } = await import("@/app/api/admin/staff/[id]/status/route");
    const res = await PATCH(
      new Request("http://localhost/api/admin/staff/u1/status", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: "INACTIVE" }),
      }),
      { params: Promise.resolve({ id: "u1" }) },
    );
    expect(res.status).toBe(403);
  });
});
