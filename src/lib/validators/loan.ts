import { z } from "zod";
import { LoanStatus } from "@prisma/client";
import { cuidSchema, moneyAmountSchema, paginationSchema } from "./common";

export const loanListSchema = paginationSchema
  .extend({
    status: z.nativeEnum(LoanStatus).optional(),
    applicantId: cuidSchema.optional(),
    q: z.string().trim().min(1).optional(),
  })
  .strict();

export const loanNoteSchema = z
  .object({
    body: z.string().trim().min(1).max(1000),
    internal: z.boolean().optional().default(true),
  })
  .strict();

export const loanRejectSchema = z
  .object({
    reason: z.string().trim().min(3).max(300),
  })
  .strict();

export const loanApproveSchema = z
  .object({
    disbursementAccountId: cuidSchema,
    approvedAmount: moneyAmountSchema.optional(),
  })
  .strict();

export const loanForwardSchema = z
  .object({
    note: z.string().trim().max(500).optional(),
  })
  .strict();

export type LoanListInput = z.infer<typeof loanListSchema>;
