import { z } from "zod";

export const cuidSchema = z.string().cuid();
export const nonEmptyString = z.string().trim().min(1);

export const moneyAmountSchema = z
  .string()
  .regex(/^\d+(\.\d{1,2})?$/, "Amount must be a valid decimal with up to 2 places")
  .refine((v) => Number(v) > 0, "Amount must be greater than 0");

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
});

export type PaginationInput = z.infer<typeof paginationSchema>;
