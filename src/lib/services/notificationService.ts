import { Prisma, PrismaClient, Role } from "@prisma/client";
import { AppError } from "@/lib/errors";
import { buildPaginationMeta, paginationToSkipTake } from "@/lib/pagination";
import type { NotificationListInput } from "@/lib/validators/notification";

export type NotificationActor = { id: string; role: Role };

const notificationSelect = {
  id: true,
  userId: true,
  type: true,
  title: true,
  message: true,
  link: true,
  read: true,
  createdAt: true,
} satisfies Prisma.NotificationSelect;

export async function listMyNotifications(
  db: PrismaClient,
  actor: NotificationActor,
  input: NotificationListInput,
) {
  const where: Prisma.NotificationWhereInput = { userId: actor.id };
  if (input.unreadOnly) where.read = false;

  const { skip, take } = paginationToSkipTake(input.page, input.pageSize);
  const [total, items] = await Promise.all([
    db.notification.count({ where }),
    db.notification.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      select: notificationSelect,
    }),
  ]);

  return { items, pagination: buildPaginationMeta(input.page, input.pageSize, total) };
}

export async function getUnreadNotificationCount(db: PrismaClient, actor: NotificationActor) {
  const count = await db.notification.count({ where: { userId: actor.id, read: false } });
  return { count };
}

export async function markNotificationRead(
  db: PrismaClient,
  actor: NotificationActor,
  notificationId: string,
) {
  const notification = await db.notification.findUnique({
    where: { id: notificationId },
    select: { id: true, userId: true },
  });
  if (!notification || notification.userId !== actor.id) {
    throw new AppError("NOT_FOUND", "Notification not found", 404);
  }

  return db.notification.update({
    where: { id: notificationId },
    data: { read: true },
    select: notificationSelect,
  });
}

export async function markAllNotificationsRead(db: PrismaClient, actor: NotificationActor) {
  const result = await db.notification.updateMany({
    where: { userId: actor.id, read: false },
    data: { read: true },
  });
  return { updated: result.count };
}
