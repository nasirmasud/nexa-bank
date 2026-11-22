import { z } from "zod";

export const updateProfileSchema = z
  .object({
    name: z.string().trim().min(2).max(100).optional(),
    phone: z.string().trim().min(7).max(20).optional().nullable(),
  })
  .strict()
  .refine((v) => v.name !== undefined || v.phone !== undefined, {
    message: "At least one field is required",
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8).max(100),
  })
  .strict();

export const setPinSchema = z
  .object({
    currentPin: z
      .string()
      .regex(/^\d{4,6}$/)
      .optional(),
    newPin: z.string().regex(/^\d{4,6}$/, "PIN must be 4-6 digits"),
  })
  .strict();

export const toggle2faSchema = z
  .object({
    enabled: z.boolean(),
  })
  .strict();

export const updateThemeSchema = z
  .object({
    theme: z.enum(["light", "dark", "system"]),
  })
  .strict();

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type SetPinInput = z.infer<typeof setPinSchema>;
