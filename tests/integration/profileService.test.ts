import bcrypt from "bcryptjs";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { Role, UserStatus } from "@prisma/client";
import { createTestPrisma, resetDb } from "../helpers/db";
import { AppError } from "@/lib/errors";
import {
  changeMyPassword,
  getMyProfile,
  setMyPin,
  toggleMy2fa,
  updateMyProfile,
  updateMyTheme,
} from "@/lib/services/profileService";

const prisma = createTestPrisma();

async function createUser(email: string, password = "Password@123", mustChangePassword = false) {
  return prisma.user.create({
    data: {
      email,
      name: "Test User",
      passwordHash: await bcrypt.hash(password, 4),
      role: Role.CUSTOMER,
      status: UserStatus.ACTIVE,
      mustChangePassword,
    },
  });
}

describe("profileService", () => {
  beforeAll(async () => {
    await prisma.$connect();
  });
  beforeEach(async () => {
    await resetDb(prisma);
  });
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("gets and updates own profile", async () => {
    const u = await createUser("u@test.com");
    const me = await getMyProfile(prisma, { id: u.id, role: Role.CUSTOMER });
    expect(me.email).toBe("u@test.com");
    expect(me.hasPin).toBe(false);

    const updated = await updateMyProfile(
      prisma,
      { id: u.id, role: Role.CUSTOMER },
      { name: "New Name", phone: "01700000000" },
    );
    expect(updated.name).toBe("New Name");
    expect(updated.phone).toBe("01700000000");
  });

  it("changes password only with correct current password", async () => {
    const u = await createUser("u@test.com", "OldPass@123");
    await expect(
      changeMyPassword(
        prisma,
        { id: u.id, role: Role.CUSTOMER },
        { currentPassword: "wrong", newPassword: "NewPass@123" },
      ),
    ).rejects.toSatisfy((e: unknown) => e instanceof AppError && e.code === "INVALID_PASSWORD");

    const res = await changeMyPassword(
      prisma,
      { id: u.id, role: Role.CUSTOMER },
      { currentPassword: "OldPass@123", newPassword: "NewPass@123" },
    );
    expect(res.ok).toBe(true);
    const dbUser = await prisma.user.findUniqueOrThrow({ where: { id: u.id } });
    expect(await bcrypt.compare("NewPass@123", dbUser.passwordHash)).toBe(true);
  });

  it("sets/changes PIN and resets lockout", async () => {
    const u = await createUser("u@test.com");
    await setMyPin(prisma, { id: u.id, role: Role.CUSTOMER }, { newPin: "1234" });
    let dbUser = await prisma.user.findUniqueOrThrow({ where: { id: u.id } });
    expect(dbUser.pinHash).toBeTruthy();
    expect(dbUser.pinFailedCount).toBe(0);

    await expect(
      setMyPin(prisma, { id: u.id, role: Role.CUSTOMER }, { newPin: "9999" }),
    ).rejects.toSatisfy((e: unknown) => e instanceof AppError && e.code === "INVALID_PIN");

    await setMyPin(
      prisma,
      { id: u.id, role: Role.CUSTOMER },
      { currentPin: "1234", newPin: "9999" },
    );
    dbUser = await prisma.user.findUniqueOrThrow({ where: { id: u.id } });
    expect(await bcrypt.compare("9999", dbUser.pinHash!)).toBe(true);
  });

  it("toggles 2fa and updates theme for actor only", async () => {
    const u = await createUser("u@test.com");
    const tfa = await toggleMy2fa(prisma, { id: u.id, role: Role.CUSTOMER }, true);
    expect(tfa.twoFactorEnabled).toBe(true);
    const theme = await updateMyTheme(prisma, { id: u.id, role: Role.CUSTOMER }, "dark");
    expect(theme.theme).toBe("dark");
  });

  it("clears mustChangePassword on successful password change and rejects same password", async () => {
    const u = await createUser("u@test.com", "TempPass@123", true);
    await expect(
      changeMyPassword(
        prisma,
        { id: u.id, role: Role.CUSTOMER },
        { currentPassword: "TempPass@123", newPassword: "TempPass@123" },
      ),
    ).rejects.toSatisfy((e: unknown) => e instanceof AppError && e.code === "VALIDATION_ERROR");

    const res = await changeMyPassword(
      prisma,
      { id: u.id, role: Role.CUSTOMER },
      { currentPassword: "TempPass@123", newPassword: "NewPass@123" },
    );
    expect(res.ok).toBe(true);
    const dbUser = await prisma.user.findUniqueOrThrow({ where: { id: u.id } });
    expect(dbUser.mustChangePassword).toBe(false);
    expect(dbUser.sessionVersion).toBe(1);
    expect(await bcrypt.compare("NewPass@123", dbUser.passwordHash)).toBe(true);
  });

  it("does not set mustChangePassword for normal users", async () => {
    const u = await createUser("u@test.com", "Password@123", false);
    const dbUser = await prisma.user.findUniqueOrThrow({ where: { id: u.id } });
    expect(dbUser.mustChangePassword).toBe(false);
  });
});
