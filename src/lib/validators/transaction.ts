import { z } from "zod";
import { TxStatus, TxType } from "@prisma/client";
import { cuidSchema, paginationSchema } from "./common";

export const transactionListSchema = paginationSchema
  .extend({
    accountId: cuidSchema.optional(),
    type: z.nativeEnum(TxType).optional(),
    status: z.nativeEnum(TxStatus).optional(),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
    q: z.string().trim().min(1).optional(),
  })
  .strict();

export type TransactionListInput = z.infer<typeof transactionListSchema>;
