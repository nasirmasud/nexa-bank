import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { Role, UserStatus } from "@prisma/client";
import { createTestPrisma, resetDb } from "../helpers/db";
import { getSettings, updateSettings } from "@/lib/services/settingsService";

const prisma = createTestPrisma();

async function createAdmin() {
  return prisma.user.create({
    data: {
      email: "admin@test.com",
      name: "Admin",
      passwordHash: "h",
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
    },
  });
}

describe("settingsService", () => {
  beforeAll(async () => {
    await prisma.$connect();
  });
  beforeEach(async () => {
    await resetDb(prisma);
  });
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("gets and updates settings as admin", async () => {
    const admin = await createAdmin();
    const actor = { id: admin.id, role: Role.ADMIN };
    const s = await getSettings(prisma, actor);
    expect(s.id).toBe(1);

    const updated = await updateSettings(prisma, actor, {
      dailyTransferLimit: "300000.00",
      maxSingleTransaction: "150000.00",
      minAccountBalance: "100.00",
      transferFeePercent: 1.5,
      minTransferFee: "10.00",
    });
    expect(updated.dailyTransferLimit.toFixed(2)).toBe("300000.00");
    expect(updated.maxSingleTransaction.toFixed(2)).toBe("150000.00");
    expect(updated.minAccountBalance.toFixed(2)).toBe("100.00");
    expect(updated.minTransferFee.toFixed(2)).toBe("10.00");
  });

  it("forbids staff", async () => {
    await createAdmin();
    await expect(getSettings(prisma, { id: "s1", role: Role.STAFF })).rejects.toMatchObject({
      status: 403,
    });
  });
});
