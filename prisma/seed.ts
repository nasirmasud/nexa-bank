import { Prisma, PrismaClient, Role, UserStatus, KycStatus, AccountType, AccountStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import { DEMO_PASSWORD, DEMO_PIN } from "../src/lib/demo-credentials";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const pinHash = await bcrypt.hash(DEMO_PIN, 10);

  // Settings singleton
  await prisma.settings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      dailyTransferLimit: new Prisma.Decimal("200000"),
      maxSingleTransaction: new Prisma.Decimal("100000"),
      minAccountBalance: new Prisma.Decimal("0"),
      transferFeePercent: new Prisma.Decimal("0.50"),
      minTransferFee: new Prisma.Decimal("5"),
      loanIncomeMultiplier: 20,
      loanInterestRates: {
        PERSONAL: 12,
        HOME: 9,
        AUTO: 10,
        EDUCATION: 8,
        BUSINESS: 11,
      },
    },
  });

  // SYSTEM account
  await prisma.account.upsert({
    where: { accountNumber: "000000000001" },
    update: {},
    create: {
      accountNumber: "000000000001",
      ownerId: null,
      type: AccountType.SYSTEM,
      status: AccountStatus.ACTIVE,
      currency: "BDT",
      balance: new Prisma.Decimal("100000000.00"),
      nickname: "NexaBank System",
    },
  });

  const users = [
    { email: "admin@nexabank.com", name: "System Admin", role: Role.ADMIN, phone: "01700000001" },
    { email: "staff1@nexabank.com", name: "Staff One", role: Role.STAFF, phone: "01700000002" },
    { email: "staff2@nexabank.com", name: "Staff Two", role: Role.STAFF, phone: "01700000003" },
    { email: "customer1@nexabank.com", name: "Demo Customer", role: Role.CUSTOMER, phone: "01700000011" },
    { email: "customer2@nexabank.com", name: "Ayesha Rahman", role: Role.CUSTOMER, phone: "01700000012" },
    { email: "customer3@nexabank.com", name: "Tanvir Hasan", role: Role.CUSTOMER, phone: "01700000013" },
    { email: "customer4@nexabank.com", name: "Nusrat Jahan", role: Role.CUSTOMER, phone: "01700000014" },
    { email: "customer5@nexabank.com", name: "Farhan Ahmed", role: Role.CUSTOMER, phone: "01700000015" },
    { email: "customer6@nexabank.com", name: "Sadia Islam", role: Role.CUSTOMER, phone: "01700000016" },
    { email: "customer7@nexabank.com", name: "Rafiul Karim", role: Role.CUSTOMER, phone: "01700000017" },
    { email: "customer8@nexabank.com", name: "Mehedi Hasan", role: Role.CUSTOMER, phone: "01700000018" },
  ] as const;

  const createdUsers = [] as Array<{ id: string; email: string; role: Role; name: string }>;

  for (const u of users) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        passwordHash,
        name: u.name,
        phone: u.phone,
        role: u.role,
        status: UserStatus.ACTIVE,
        ...(u.email === "customer1@nexabank.com" ? { pinHash } : {}),
      },
      select: { id: true, email: true, role: true, name: true },
    });
    createdUsers.push(user);
  }

  const customerProfiles = [
    { email: "customer1@nexabank.com", customerNo: "CUS-000001", nid: "1000000001", kycStatus: KycStatus.VERIFIED, occupation: "Software Engineer" },
    { email: "customer2@nexabank.com", customerNo: "CUS-000002", nid: "1000000002", kycStatus: KycStatus.VERIFIED, occupation: "Teacher" },
    { email: "customer3@nexabank.com", customerNo: "CUS-000003", nid: "1000000003", kycStatus: KycStatus.PENDING, occupation: "Business Owner" },
    { email: "customer4@nexabank.com", customerNo: "CUS-000004", nid: "1000000004", kycStatus: KycStatus.VERIFIED, occupation: "Doctor" },
    { email: "customer5@nexabank.com", customerNo: "CUS-000005", nid: "1000000005", kycStatus: KycStatus.VERIFIED, occupation: "Accountant" },
    { email: "customer6@nexabank.com", customerNo: "CUS-000006", nid: "1000000006", kycStatus: KycStatus.PENDING, occupation: "Student" },
    { email: "customer7@nexabank.com", customerNo: "CUS-000007", nid: "1000000007", kycStatus: KycStatus.VERIFIED, occupation: "Freelancer" },
    { email: "customer8@nexabank.com", customerNo: "CUS-000008", nid: "1000000008", kycStatus: KycStatus.REJECTED, occupation: "Sales Executive" },
  ] as const;

  for (const p of customerProfiles) {
    const user = createdUsers.find((u) => u.email === p.email);
    if (!user) continue;
    await prisma.customerProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        customerNo: p.customerNo,
        nid: p.nid,
        dateOfBirth: new Date("1995-01-01"),
        occupation: p.occupation,
        presentAddress: "Dhaka, Bangladesh",
        permanentAddress: "Dhaka, Bangladesh",
        kycStatus: p.kycStatus,
      },
    });
  }

  const byEmail = Object.fromEntries(createdUsers.map((u) => [u.email, u]));
  const demo = byEmail["customer1@nexabank.com"];

  const accounts = [
    { accountNumber: "100000000101", ownerEmail: "customer1@nexabank.com", type: AccountType.SAVINGS, nickname: "Demo Savings" },
    { accountNumber: "100000000102", ownerEmail: "customer1@nexabank.com", type: AccountType.CURRENT, nickname: "Demo Current" },
    { accountNumber: "100000000103", ownerEmail: "customer1@nexabank.com", type: AccountType.BUSINESS, nickname: "Demo Business" },
    { accountNumber: "100000000201", ownerEmail: "customer2@nexabank.com", type: AccountType.SAVINGS, nickname: "Ayesha Savings" },
    { accountNumber: "100000000202", ownerEmail: "customer2@nexabank.com", type: AccountType.CURRENT, nickname: "Ayesha Current" },
    { accountNumber: "100000000301", ownerEmail: "customer3@nexabank.com", type: AccountType.SAVINGS, nickname: "Tanvir Savings" },
    { accountNumber: "100000000401", ownerEmail: "customer4@nexabank.com", type: AccountType.SAVINGS, nickname: "Nusrat Savings" },
    { accountNumber: "100000000402", ownerEmail: "customer4@nexabank.com", type: AccountType.BUSINESS, nickname: "Nusrat Business" },
    { accountNumber: "100000000501", ownerEmail: "customer5@nexabank.com", type: AccountType.SAVINGS, nickname: "Farhan Savings" },
    { accountNumber: "100000000601", ownerEmail: "customer6@nexabank.com", type: AccountType.SAVINGS, nickname: "Sadia Savings" },
    { accountNumber: "100000000701", ownerEmail: "customer7@nexabank.com", type: AccountType.CURRENT, nickname: "Rafiul Current" },
    { accountNumber: "100000000702", ownerEmail: "customer7@nexabank.com", type: AccountType.SAVINGS, nickname: "Rafiul Savings" },
    { accountNumber: "100000000801", ownerEmail: "customer8@nexabank.com", type: AccountType.SAVINGS, nickname: "Mehedi Savings" },
    { accountNumber: "100000000802", ownerEmail: "customer8@nexabank.com", type: AccountType.CURRENT, nickname: "Mehedi Current" },
  ] as const;

  for (const a of accounts) {
    const owner = byEmail[a.ownerEmail];
    if (!owner) continue;
    await prisma.account.upsert({
      where: { accountNumber: a.accountNumber },
      update: {},
      create: {
        accountNumber: a.accountNumber,
        ownerId: owner.id,
        type: a.type,
        status: AccountStatus.ACTIVE,
        currency: "BDT",
        balance: new Prisma.Decimal("0.00"),
        nickname: a.nickname,
      },
    });
  }

  console.log("Seed completed (Phase 1 minimal). Demo password for all seeded users:", DEMO_PASSWORD);
  console.log("Admin:", "admin@nexabank.com");
  console.log("Staff:", "staff1@nexabank.com, staff2@nexabank.com");
  console.log("Demo customer:", demo?.email ?? "customer1@nexabank.com");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
