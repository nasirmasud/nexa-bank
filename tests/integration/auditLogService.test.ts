import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { Role, UserStatus } from "@prisma/client";
import { createTestPrisma, resetDb } from "../helpers/db";
import { listAuditLogs } from "@/lib/services/auditLogService";

const prisma = createTestPrisma();

describe("auditLogService", () => {
  beforeAll(async () => {
    await prisma.$connect();
  });
  beforeEach(async () => {
    await resetDb(prisma);
  });
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("lists audit logs for admin with pagination", async () => {
    const admin = await prisma.user.create({
      data: {
        email: "a@test.com",
        name: "Admin",
        passwordHash: "h",
        role: Role.ADMIN,
        status: UserStatus.ACTIVE,
      },
    });
    await prisma.auditLog.createMany({
      data: [
        { actorId: admin.id, action: "USER_BLOCKED", entityType: "User", entityId: "u1" },
        { actorId: admin.id, action: "ACCOUNT_FROZEN", entityType: "Account", entityId: "a1" },
      ],
    });

    const res = await listAuditLogs(
      prisma,
      { id: admin.id, role: Role.ADMIN },
      { page: 1, pageSize: 10 },
    );
    expect(res.pagination.total).toBe(2);
    expect(res.items[0]).toHaveProperty("action");
    expect(res.items[0]).toHaveProperty("entityType");
  });

  it("forbids staff", async () => {
    await expect(
      listAuditLogs(prisma, { id: "s1", role: Role.STAFF }, { page: 1, pageSize: 10 }),
    ).rejects.toMatchObject({ status: 403 });
  });
});
