import { z } from "zod";
import { cuidSchema, moneyAmountSchema, nonEmptyString } from "./common";

export const createTransferSchema = z
  .object({
    fromAccountId: cuidSchema,
    toAccountNumber: z.string().regex(/^\d{12}$/, "Account number must be 12 digits"),
    amount: moneyAmountSchema,
    description: z.string().trim().max(200).optional(),
    pin: z.string().regex(/^\d{4,6}$/, "PIN must be 4-6 digits"),
    idempotencyKey: nonEmptyString.max(128),
  })
  .strict();

export type CreateTransferInput = z.infer<typeof createTransferSchema>;
