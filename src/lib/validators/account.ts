import { z } from "zod";
import { AccountStatus, AccountType } from "@prisma/client";
import { cuidSchema, moneyAmountSchema, paginationSchema } from "./common";

export const createAccountSchema = z
  .object({
    ownerId: cuidSchema,
    type: z.nativeEnum(AccountType).refine((v) => v !== "SYSTEM", "Cannot create SYSTEM account"),
    nickname: z.string().trim().min(1).max(50).optional(),
    dailyTransferLimit: moneyAmountSchema.optional(),
    perTxLimit: moneyAmountSchema.optional(),
    minBalance: moneyAmountSchema.optional(),
  })
  .strict();

export const accountListSchema = paginationSchema
  .extend({
    ownerId: cuidSchema.optional(),
    status: z.nativeEnum(AccountStatus).optional(),
    type: z.nativeEnum(AccountType).optional(),
    q: z.string().trim().min(1).optional(),
  })
  .strict();

export const accountLookupSchema = z
  .object({
    number: z.string().regex(/^\d{12}$/, "Account number must be 12 digits"),
  })
  .strict();

export const freezeAccountSchema = z
  .object({
    reason: z.string().trim().min(3).max(200),
  })
  .strict();

export const accountLimitsSchema = z
  .object({
    dailyTransferLimit: moneyAmountSchema.nullable().optional(),
    perTxLimit: moneyAmountSchema.nullable().optional(),
    minBalance: moneyAmountSchema.nullable().optional(),
  })
  .strict();

export const accountStatementSchema = z
  .object({
    format: z.enum(["csv", "pdf"]).default("csv"),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
  })
  .strict();

export type CreateAccountInput = z.infer<typeof createAccountSchema>;
export type AccountListInput = z.infer<typeof accountListSchema>;
export type AccountStatementInput = z.infer<typeof accountStatementSchema>;
