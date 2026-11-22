import { z } from "zod";
import { RequestType } from "@prisma/client";
import { cuidSchema, moneyAmountSchema, paginationSchema } from "./common";

export const createRequestSchema = z
  .object({
    type: z.nativeEnum(RequestType),
    accountId: cuidSchema,
    amount: moneyAmountSchema,
    description: z.string().trim().max(200).optional(),
  })
  .strict();

export const requestListSchema = paginationSchema
  .extend({
    status: z.enum(["PENDING", "APPROVED", "REJECTED", "CANCELLED"]).optional(),
    type: z.nativeEnum(RequestType).optional(),
    accountId: cuidSchema.optional(),
  })
  .strict();

export const rejectRequestSchema = z
  .object({
    reason: z.string().trim().min(3).max(200),
  })
  .strict();

export type CreateRequestInput = z.infer<typeof createRequestSchema>;
