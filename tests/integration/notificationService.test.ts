import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { NotificationType, Role, UserStatus } from "@prisma/client";
import { createTestPrisma, resetDb } from "../helpers/db";
import { AppError } from "@/lib/errors";
import {
  getUnreadNotificationCount,
  listMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/services/notificationService";

const prisma = createTestPrisma();

async function createUser(email: string) {
  return prisma.user.create({
    data: {
      email,
      name: email,
      passwordHash: "hash",
      role: Role.CUSTOMER,
      status: UserStatus.ACTIVE,
    },
  });
}

async function createNotification(userId: string, read = false) {
  return prisma.notification.create({
    data: {
      userId,
      type: NotificationType.TRANSFER_COMPLETED,
      title: "Test",
      message: "Message",
      read,
    },
  });
}

describe("notificationService", () => {
  beforeAll(async () => {
    await prisma.$connect();
  });
  beforeEach(async () => {
    await resetDb(prisma);
  });
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("lists notifications scoped to actor only", async () => {
    const u1 = await createUser("u1@test.com");
    const u2 = await createUser("u2@test.com");
    await createNotification(u1.id, false);
    await createNotification(u1.id, true);
    await createNotification(u2.id, false);

    const res = await listMyNotifications(
      prisma,
      { id: u1.id, role: Role.CUSTOMER },
      { page: 1, pageSize: 10 },
    );
    expect(res.pagination.total).toBe(2);
    expect(res.items.every((n) => n.userId === u1.id)).toBe(true);
  });

  it("returns unread count scoped to actor only", async () => {
    const u1 = await createUser("u1@test.com");
    const u2 = await createUser("u2@test.com");
    await createNotification(u1.id, false);
    await createNotification(u1.id, true);
    await createNotification(u2.id, false);

    const res = await getUnreadNotificationCount(prisma, { id: u1.id, role: Role.CUSTOMER });
    expect(res.count).toBe(1);
  });

  it("marks own notification read", async () => {
    const u1 = await createUser("u1@test.com");
    const n = await createNotification(u1.id, false);

    const updated = await markNotificationRead(prisma, { id: u1.id, role: Role.CUSTOMER }, n.id);
    expect(updated.read).toBe(true);
  });

  it("does not mark another user's notification (returns 404, no leak)", async () => {
    const u1 = await createUser("u1@test.com");
    const u2 = await createUser("u2@test.com");
    const n2 = await createNotification(u2.id, false);

    await expect(
      markNotificationRead(prisma, { id: u1.id, role: Role.CUSTOMER }, n2.id),
    ).rejects.toSatisfy((e: unknown) => e instanceof AppError && e.status === 404);

    const stillUnread = await prisma.notification.findUniqueOrThrow({ where: { id: n2.id } });
    expect(stillUnread.read).toBe(false);
  });

  it("mark-all-read only affects actor notifications", async () => {
    const u1 = await createUser("u1@test.com");
    const u2 = await createUser("u2@test.com");
    await createNotification(u1.id, false);
    await createNotification(u1.id, false);
    const n2 = await createNotification(u2.id, false);

    const res = await markAllNotificationsRead(prisma, { id: u1.id, role: Role.CUSTOMER });
    expect(res.updated).toBe(2);

    const u2n = await prisma.notification.findUniqueOrThrow({ where: { id: n2.id } });
    expect(u2n.read).toBe(false);
  });
});
