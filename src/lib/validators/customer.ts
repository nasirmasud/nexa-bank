import { z } from "zod";
import { paginationSchema } from "./common";

export const createCustomerSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    email: z.string().trim().email(),
    phone: z.string().trim().min(7).max(20).optional(),
    nid: z.string().trim().min(5).max(30),
    dateOfBirth: z.coerce.date(),
    presentAddress: z.string().trim().min(5).max(300),
    permanentAddress: z.string().trim().max(300).optional(),
    occupation: z.string().trim().max(100).optional(),
    password: z.string().min(8).max(100).optional(),
  })
  .strict();

export const customerListSchema = paginationSchema
  .extend({
    q: z.string().trim().min(1).optional(),
  })
  .strict();

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type CustomerListInput = z.infer<typeof customerListSchema>;
