import { z } from "zod";
import { EmploymentStatus, LoanStatus, LoanType } from "@prisma/client";
import { cuidSchema, moneyAmountSchema, paginationSchema } from "./common";

export const loanListSchema = paginationSchema
  .extend({
    status: z.nativeEnum(LoanStatus).optional(),
    applicantId: cuidSchema.optional(),
    q: z.string().trim().min(1).optional(),
  })
  .strict();

export const applyLoanSchema = z
  .object({
    type: z.nativeEnum(LoanType),
    requestedAmount: moneyAmountSchema,
    durationMonths: z.coerce.number().int().min(1).max(360),
    monthlyIncome: moneyAmountSchema,
    employmentStatus: z.nativeEnum(EmploymentStatus),
    description: z.string().trim().max(1000).optional(),
    disbursementAccountId: cuidSchema,
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
export type ApplyLoanInput = z.infer<typeof applyLoanSchema>;
