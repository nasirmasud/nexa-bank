import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import type { Role } from "@prisma/client";

export type SessionUser = { id: string; role: Role; email: string; name: string };

export async function requireAuth(): Promise<SessionUser> {
  const { auth } = await import("@/lib/auth");
  const session = await auth();
  const user = session?.user as SessionUser | undefined;
  if (!user?.id) throw new AppError("UNAUTHORIZED", "Authentication required", 401);
  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { status: true, sessionVersion: true, role: true } });
  if (!dbUser || dbUser.status !== "ACTIVE") throw new AppError("UNAUTHORIZED", "Account disabled or blocked", 401);
  return { ...user, role: dbUser.role };
}

export async function requireRole(...roles: Role[]): Promise<SessionUser> {
  const user = await requireAuth();
  if (!roles.includes(user.role)) throw new AppError("FORBIDDEN", "Not authorized", 403);
  return user;
}

export async function assertAccountOwner(user: SessionUser, accountId: string) {
  if (user.role !== "CUSTOMER") return;
  const account = await prisma.account.findUnique({ where: { id: accountId }, select: { ownerId: true } });
  if (!account || account.ownerId !== user.id) throw new AppError("NOT_FOUND", "Account not found", 404);
}

export function assertNotSelf(user: Pick<SessionUser, "id">, targetUserId: string) {
  if (user.id === targetUserId) throw new AppError("FORBIDDEN", "Cannot approve your own request", 403);
}
