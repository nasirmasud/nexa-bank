import { z } from "zod";
import { paginationSchema } from "./common";

export const notificationListSchema = paginationSchema
  .extend({
    unreadOnly: z.coerce.boolean().optional(),
  })
  .strict();

export type NotificationListInput = z.infer<typeof notificationListSchema>;
