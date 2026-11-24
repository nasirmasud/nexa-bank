import { z } from "zod";
import { paginationSchema } from "./common";

export const createStaffSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    email: z.string().trim().email(),
    phone: z.string().trim().min(7).max(20).optional(),
    temporaryPassword: z.string().min(8).max(100),
  })
  .strict();

export const staffListSchema = paginationSchema
  .extend({
    q: z.string().trim().min(1).optional(),
  })
  .strict();

export const updateStaffStatusSchema = z
  .object({
    status: z.enum(["ACTIVE", "INACTIVE"]),
  })
  .strict();

export type CreateStaffInput = z.infer<typeof createStaffSchema>;
export type StaffListInput = z.infer<typeof staffListSchema>;
export type UpdateStaffStatusInput = z.infer<typeof updateStaffStatusSchema>;
