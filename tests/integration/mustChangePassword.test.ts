import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
const findUniqueMock = vi.fn();

vi.mock("@/lib/auth", () => ({ auth: authMock }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: findUniqueMock },
  },
}));

describe("mustChangePassword enforcement", () => {
  beforeEach(() => {
    authMock.mockReset();
    findUniqueMock.mockReset();
  });

  it("returns 403 PASSWORD_CHANGE_REQUIRED for flagged user on normal API", async () => {
    authMock.mockResolvedValue({
      user: { id: "u1", role: "CUSTOMER", email: "c@test.com", name: "Cust", sessionVersion: 0 },
    });
    findUniqueMock.mockResolvedValue({
      status: "ACTIVE",
      sessionVersion: 0,
      role: "CUSTOMER",
      mustChangePassword: true,
    });
    const { GET } = await import("@/app/api/accounts/route");
    const res = await GET(new Request("http://localhost/api/accounts?page=1&pageSize=20"));
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error.code).toBe("PASSWORD_CHANGE_REQUIRED");
  });

  it("allows flagged user to read own profile", async () => {
    authMock.mockResolvedValue({
      user: { id: "u1", role: "CUSTOMER", email: "c@test.com", name: "Cust", sessionVersion: 0 },
    });
    findUniqueMock.mockResolvedValue({
      status: "ACTIVE",
      sessionVersion: 0,
      role: "CUSTOMER",
      mustChangePassword: true,
    });
    const { GET } = await import("@/app/api/me/route");
    const res = await GET(new Request("http://localhost/api/me"));
    // GET /api/me should not be blocked by PASSWORD_CHANGE_REQUIRED; it may fail later due to missing profile mock,
    // but it must not return PASSWORD_CHANGE_REQUIRED.
    if (res.status === 403) {
      const body = await res.json();
      expect(body.error.code).not.toBe("PASSWORD_CHANGE_REQUIRED");
    } else {
      expect([200, 404, 500]).toContain(res.status);
    }
  });

  it("allows flagged user to call password change endpoint", async () => {
    authMock.mockResolvedValue({
      user: { id: "u1", role: "CUSTOMER", email: "c@test.com", name: "Cust", sessionVersion: 0 },
    });
    findUniqueMock.mockResolvedValue({
      status: "ACTIVE",
      sessionVersion: 0,
      role: "CUSTOMER",
      mustChangePassword: true,
    });
    const { POST } = await import("@/app/api/me/password/route");
    const res = await POST(
      new Request("http://localhost/api/me/password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      }),
    );
    // Should fail validation (422), not PASSWORD_CHANGE_REQUIRED (403)
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });
});
