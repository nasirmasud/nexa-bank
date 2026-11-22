import { z } from "zod";
import { moneyAmountSchema } from "./common";

export const updateSettingsSchema = z
  .object({
    dailyTransferLimit: moneyAmountSchema.optional(),
    maxSingleTransaction: moneyAmountSchema.optional(),
    minAccountBalance: moneyAmountSchema.optional(),
    transferFeePercent: z.coerce.number().min(0).max(100).optional(),
    minTransferFee: moneyAmountSchema.optional(),
  })
  .strict();

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
