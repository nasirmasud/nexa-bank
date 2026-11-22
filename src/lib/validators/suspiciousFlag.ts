import { z } from "zod";
import { FlagStatus } from "@prisma/client";
import { paginationSchema } from "./common";

export const suspiciousFlagListSchema = paginationSchema
  .extend({
    status: z.nativeEnum(FlagStatus).optional(),
  })
  .strict();

export const resolveFlagSchema = z
  .object({
    status: z.enum([FlagStatus.DISMISSED, FlagStatus.ESCALATED]),
    resolutionNote: z.string().trim().min(3).max(500),
  })
  .strict();

export type SuspiciousFlagListInput = z.infer<typeof suspiciousFlagListSchema>;
export type ResolveFlagInput = z.infer<typeof resolveFlagSchema>;
