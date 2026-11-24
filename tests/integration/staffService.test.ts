import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { Role, UserStatus } from "@prisma/client";
import { createTestPrisma, resetDb } from "../helpers/db";
import { createStaffSchema } from "@/lib/validators/staff";
import { createStaff, listStaff, updateStaffStatus } from "@/lib/services/staffService";

const prisma = createTestPrisma();

async function createAdmin(email = "admin@test.com") {
  return prisma.user.create({
    data: {
      email,
      name: "Admin",
      passwordHash: "hash",
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
    },
  });
}

async function createStaffUser(email = "staff@test.com") {
  return prisma.user.create({
    data: {
      email,
      name: "Staff",
      passwordHash: "hash",
      role: Role.STAFF,
      status: UserStatus.ACTIVE,
    },
  });
}

describe("staffService", () => {
  beforeAll(async () => {
    await prisma.$connect();
  });
  beforeEach(async () => {
    await resetDb(prisma);
  });
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("ADMIN can create staff (role STAFF, no password hash returned)", async () => {
    const admin = await createAdmin();
    const res = await createStaff(
      prisma,
      { id: admin.id, role: Role.ADMIN },
      { name: "Staff One", email: "s1@test.com", temporaryPassword: "TempPass@123" },
    );

    expect(res.staff.role).toBe(Role.STAFF);
    expect(res.staff.email).toBe("s1@test.com");
    expect((res.staff as Record<string, unknown>).passwordHash).toBeUndefined();

    const dbUser = await prisma.user.findUnique({ where: { id: res.staff.id } });
    expect(dbUser?.role).toBe(Role.STAFF);
    expect(dbUser?.passwordHash).toBeTruthy();
    expect(dbUser?.passwordHash).not.toBe("TempPass@123");

    const audit = await prisma.auditLog.findFirst({ where: { action: "STAFF_CREATED", entityId: res.staff.id } });
    expect(audit?.actorId).toBe(admin.id);
  });

  it("STAFF and CUSTOMER get 403 for create/list/deactivate", async () => {
    const admin = await createAdmin();
    const staff = await createStaffUser("existing@test.com");

    await expect(
      createStaff(prisma, { id: staff.id, role: Role.STAFF }, { name: "X", email: "x@test.com", temporaryPassword: "TempPass@123" }),
    ).rejects.toMatchObject({ status: 403 });
    await expect(listStaff(prisma, { id: staff.id, role: Role.STAFF }, { page: 1, pageSize: 10 })).rejects.toMatchObject({ status: 403 });
    await expect(updateStaffStatus(prisma, { id: staff.id, role: Role.STAFF }, admin.id, UserStatus.INACTIVE)).rejects.toMatchObject({ status: 403 });

    await expect(
      createStaff(prisma, { id: "c1", role: Role.CUSTOMER }, { name: "X", email: "x2@test.com", temporaryPassword: "TempPass@123" }),
    ).rejects.toMatchObject({ status: 403 });
    await expect(listStaff(prisma, { id: "c1", role: Role.CUSTOMER }, { page: 1, pageSize: 10 })).rejects.toMatchObject({ status: 403 });
  });

  it("ADMIN can deactivate staff, bumps sessionVersion, and writes audit log", async () => {
    const admin = await createAdmin();
    const staff = await createStaffUser("staff2@test.com");
    const before = await prisma.user.findUnique({ where: { id: staff.id }, select: { sessionVersion: true, status: true } });

    const updated = await updateStaffStatus(prisma, { id: admin.id, role: Role.ADMIN }, staff.id, UserStatus.INACTIVE);

    expect(updated.status).toBe(UserStatus.INACTIVE);
    const after = await prisma.user.findUnique({ where: { id: staff.id }, select: { sessionVersion: true, status: true } });
    expect(after?.status).toBe(UserStatus.INACTIVE);
    expect(after?.sessionVersion).toBe((before?.sessionVersion ?? 0) + 1);

    const audit = await prisma.auditLog.findFirst({ where: { action: "STAFF_DEACTIVATED", entityId: staff.id } });
    expect(audit?.actorId).toBe(admin.id);
  });

  it("deactivated staff cannot log in or use an old session (status inactive + sessionVersion bumped)", async () => {
    const admin = await createAdmin();
    const staff = await createStaffUser("staff3@test.com");

    await updateStaffStatus(prisma, { id: admin.id, role: Role.ADMIN }, staff.id, UserStatus.INACTIVE);

    const dbUser = await prisma.user.findUnique({ where: { id: staff.id }, select: { status: true, sessionVersion: true } });
    // Login is blocked by auth.ts when status !== ACTIVE
    expect(dbUser?.status).toBe(UserStatus.INACTIVE);
    // Old JWT sessions are rejected by guards.ts when sessionVersion mismatches
    expect(dbUser?.sessionVersion).toBeGreaterThan(0);
  });

  it("admin cannot deactivate themselves", async () => {
    const admin = await createAdmin();
    await expect(
      updateStaffStatus(prisma, { id: admin.id, role: Role.ADMIN }, admin.id, UserStatus.INACTIVE),
    ).rejects.toMatchObject({ status: 403 });
  });

  it("role field in create body is rejected by strict schema", () => {
    const result = createStaffSchema.safeParse({
      name: "Staff",
      email: "staff@test.com",
      temporaryPassword: "TempPass@123",
      role: "ADMIN",
    });
    expect(result.success).toBe(false);
  });
});
