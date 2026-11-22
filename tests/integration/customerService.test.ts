import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { Role, UserStatus } from "@prisma/client";
import { createTestPrisma, resetDb } from "../helpers/db";
import { AppError } from "@/lib/errors";
import {
  createCustomer,
  getCustomerById,
  listCustomers,
  updateCustomerStatus,
} from "@/lib/services/customerService";

const prisma = createTestPrisma();

async function createStaff(email = "staff@test.com") {
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

describe("customerService", () => {
  beforeAll(async () => {
    await prisma.$connect();
  });
  beforeEach(async () => {
    await resetDb(prisma);
  });
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("staff can create and list customers", async () => {
    const staff = await createStaff();
    const res = await createCustomer(
      prisma,
      { id: staff.id, role: Role.STAFF },
      {
        name: "John Doe",
        email: "john@test.com",
        nid: "1234567890",
        dateOfBirth: new Date("1990-01-01"),
        presentAddress: "Dhaka",
      },
    );
    expect(res.customer.email).toBe("john@test.com");
    expect(res.tempPassword).toBeTruthy();

    const list = await listCustomers(
      prisma,
      { id: staff.id, role: Role.STAFF },
      { page: 1, pageSize: 10 },
    );
    expect(list.pagination.total).toBe(1);
  });

  it("customer cannot create/list/get customers", async () => {
    const staff = await createStaff();
    const created = await createCustomer(
      prisma,
      { id: staff.id, role: Role.STAFF },
      {
        name: "John Doe",
        email: "john@test.com",
        nid: "1234567890",
        dateOfBirth: new Date("1990-01-01"),
        presentAddress: "Dhaka",
      },
    );
    const actor = { id: "cust-id", role: Role.CUSTOMER as Role };
    await expect(listCustomers(prisma, actor, { page: 1, pageSize: 10 })).rejects.toMatchObject({
      status: 403,
    });
    await expect(getCustomerById(prisma, actor, created.customer.id)).rejects.toMatchObject({
      status: 403,
    });
  });

  it("rejects duplicate email/nid", async () => {
    const staff = await createStaff();
    const input = {
      name: "John Doe",
      email: "john@test.com",
      nid: "1234567890",
      dateOfBirth: new Date("1990-01-01"),
      presentAddress: "Dhaka",
    };
    await createCustomer(prisma, { id: staff.id, role: Role.STAFF }, input);
    await expect(
      createCustomer(
        prisma,
        { id: staff.id, role: Role.STAFF },
        { ...input, email: "other@test.com" },
      ),
    ).rejects.toSatisfy((e: unknown) => e instanceof AppError && e.status === 422);
  });

  it("admin can block customer and bumps sessionVersion", async () => {
    const staff = await createStaff();
    const admin = await prisma.user.create({
      data: {
        email: "admin@test.com",
        name: "Admin",
        passwordHash: "hash",
        role: Role.ADMIN,
        status: UserStatus.ACTIVE,
      },
    });
    const created = await createCustomer(
      prisma,
      { id: staff.id, role: Role.STAFF },
      {
        name: "John Doe",
        email: "john@test.com",
        nid: "1234567890",
        dateOfBirth: new Date("1990-01-01"),
        presentAddress: "Dhaka",
      },
    );
    const before = await prisma.user.findUniqueOrThrow({
      where: { id: created.customer.id },
      select: { sessionVersion: true },
    });

    const updated = await updateCustomerStatus(
      prisma,
      { id: admin.id, role: Role.ADMIN },
      created.customer.id,
      UserStatus.BLOCKED,
    );
    expect(updated.status).toBe(UserStatus.BLOCKED);

    const after = await prisma.user.findUniqueOrThrow({
      where: { id: created.customer.id },
      select: { sessionVersion: true },
    });
    expect(after.sessionVersion).toBe(before.sessionVersion + 1);
  });

  it("staff cannot update customer status", async () => {
    const staff = await createStaff();
    const created = await createCustomer(
      prisma,
      { id: staff.id, role: Role.STAFF },
      {
        name: "John Doe",
        email: "john@test.com",
        nid: "1234567890",
        dateOfBirth: new Date("1990-01-01"),
        presentAddress: "Dhaka",
      },
    );
    await expect(
      updateCustomerStatus(
        prisma,
        { id: staff.id, role: Role.STAFF },
        created.customer.id,
        UserStatus.BLOCKED,
      ),
    ).rejects.toMatchObject({ status: 403 });
  });
});
