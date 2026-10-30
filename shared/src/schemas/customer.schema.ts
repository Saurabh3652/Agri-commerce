import { z } from "zod";
import { SUPPORTED_LOCALES } from "../constants";
import { phoneSchema } from "./auth.schema";

export const addressInputSchema = z.object({
  label: z.string().trim().max(20).optional(),
  name: z.string().trim().min(2).max(80),
  phone: phoneSchema,
  line1: z.string().trim().min(3).max(200),
  village: z.string().trim().max(100).optional(),
  landmark: z.string().trim().max(150).optional(),
  taluka: z.string().trim().max(100).optional(),
  district: z.string().trim().min(2).max(100),
  state: z.string().trim().min(2).max(100).default("Gujarat"),
  pincode: z.string().trim().regex(/^[1-9]\d{5}$/, "Enter a valid 6-digit pincode"),
  isDefault: z.boolean().default(false),
});
export type AddressInput = z.infer<typeof addressInputSchema>;
/** What a form sends: fields with defaults (state, isDefault) may be left out. */
export type NewAddress = z.input<typeof addressInputSchema>;

export const addressParamSchema = z.object({
  addressId: z.string().regex(/^[a-f0-9]{24}$/, "Invalid address id"),
});

/**
 * Fields a customer may change about themselves.
 * `phone` and `role` are deliberately absent: changing a phone needs OTP proof of the new
 * number, and nobody may change their own role.
 */
export const updateProfileSchema = z
  .object({
    firstName: z.string().trim().min(2).max(40),
    lastName: z.string().trim().max(40).nullable(),
    email: z.email().max(120).nullable(),
    dateOfBirth: z.iso.date().nullable(),
    gstin: z.string().trim().length(15).nullable(),
    locale: z.enum(SUPPORTED_LOCALES),
  })
  .partial();
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
