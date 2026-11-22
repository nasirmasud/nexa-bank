import bcrypt from "bcryptjs";
import { KycStatus, Prisma, PrismaClient, Role, UserStatus } from "@prisma/client";
import { AppError } from "@/lib/errors";
import { buildPaginationMeta, paginationToSkipTake } from "@/lib/pagination";
import type { CreateCustomerInput, CustomerListInput } from "@/lib/validators/customer";

export type CustomerActor = { id: string; role: Role };

const customerSelect = {
  id: true,
  email: true,
  name: true,
  phone: true,
  role: true,
  status: true,
  createdAt: true,
  profile: {
    select: {
      customerNo: true,
      nid: true,
      dateOfBirth: true,
      presentAddress: true,
      permanentAddress: true,
      occupation: true,
      kycStatus: true,
    },
  },
} satisfies Prisma.UserSelect;

function randomDigits(len: number) {
  let out = "";
  for (let i = 0; i < len; i++) out += Math.floor(Math.random() * 10);
  return out;
}

function generateTempPassword() {
  return `Tmp@${randomDigits(6)}Aa`;
}

async function generateCustomerNo(db: PrismaClient) {
  for (let i = 0; i < 10; i++) {
    const customerNo = `CUS-${randomDigits(6)}`;
    const exists = await db.customerProfile.findUnique({
      where: { customerNo },
      select: { id: true },
    });
    if (!exists) return customerNo;
  }
  throw new AppError("INTERNAL_ERROR", "Failed to generate customer number", 500);
}

export async function createCustomer(
  db: PrismaClient,
  actor: CustomerActor,
  input: CreateCustomerInput,
) {
  if (actor.role === Role.CUSTOMER) throw new AppError("FORBIDDEN", "Not authorized", 403);

  const tempPassword = input.password ? null : generateTempPassword();
  const password = input.password ?? tempPassword!;
  const passwordHash = await bcrypt.hash(password, 12);
  const customerNo = await generateCustomerNo(db);

  try {
    const user = await db.user.create({
      data: {
        email: input.email,
        passwordHash,
        name: input.name,
        phone: input.phone,
        role: Role.CUSTOMER,
        status: UserStatus.ACTIVE,
        createdById: actor.id,
        profile: {
          create: {
            customerNo,
            nid: input.nid,
            dateOfBirth: input.dateOfBirth,
            presentAddress: input.presentAddress,
            permanentAddress: input.permanentAddress,
            occupation: input.occupation,
          },
        },
      },
      select: customerSelect,
    });
    return { customer: user, tempPassword };
  } catch (err) {
    if ((err as { code?: string }).code === "P2002") {
      throw new AppError("VALIDATION_ERROR", "Email, NID, or customer number already exists", 422);
    }
    throw err;
  }
}

export async function listCustomers(
  db: PrismaClient,
  actor: CustomerActor,
  input: CustomerListInput,
) {
  if (actor.role === Role.CUSTOMER) throw new AppError("FORBIDDEN", "Not authorized", 403);

  const where: Prisma.UserWhereInput = { role: Role.CUSTOMER };
  if (input.q) {
    where.OR = [
      { name: { contains: input.q, mode: "insensitive" } },
      { email: { contains: input.q, mode: "insensitive" } },
      { phone: { contains: input.q, mode: "insensitive" } },
      { profile: { customerNo: { contains: input.q, mode: "insensitive" } } },
      { profile: { nid: { contains: input.q, mode: "insensitive" } } },
    ];
  }

  const { skip, take } = paginationToSkipTake(input.page, input.pageSize);
  const [total, items] = await Promise.all([
    db.user.count({ where }),
    db.user.findMany({ where, skip, take, orderBy: { createdAt: "desc" }, select: customerSelect }),
  ]);

  return { items, pagination: buildPaginationMeta(input.page, input.pageSize, total) };
}

export async function getCustomerById(db: PrismaClient, actor: CustomerActor, id: string) {
  if (actor.role === Role.CUSTOMER) throw new AppError("FORBIDDEN", "Not authorized", 403);
  const user = await db.user.findFirst({
    where: { id, role: Role.CUSTOMER },
    select: customerSelect,
  });
  if (!user) throw new AppError("NOT_FOUND", "Customer not found", 404);
  return user;
}

export async function updateCustomerKyc(
  db: PrismaClient,
  actor: CustomerActor,
  id: string,
  kycStatus: KycStatus,
) {
  if (actor.role === Role.CUSTOMER) throw new AppError("FORBIDDEN", "Not authorized", 403);
  const existing = await db.user.findFirst({
    where: { id, role: Role.CUSTOMER },
    select: { id: true, profile: { select: { id: true } } },
  });
  if (!existing?.profile) throw new AppError("NOT_FOUND", "Customer not found", 404);

  await db.customerProfile.update({
    where: { userId: id },
    data: { kycStatus },
  });

  return getCustomerById(db, actor, id);
}
