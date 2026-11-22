import { z } from "zod";
import { paginationSchema } from "./common";

export const auditLogListSchema = paginationSchema
  .extend({
    action: z.string().trim().min(1).optional(),
    entityType: z.string().trim().min(1).optional(),
  })
  .strict();

export type AuditLogListInput = z.infer<typeof auditLogListSchema>;
