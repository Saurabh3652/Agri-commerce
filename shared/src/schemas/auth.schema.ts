import { z } from "zod";
import { OTP_LENGTH, SIGNUP_ROLES } from "../constants";

/**
 * Indian mobile number, stored as 10 bare digits.
 * Accepts the ways people actually type it: "98765 43210", "+91-9876543210", "09876543210".
 * A country code is removed only when doing so leaves exactly 10 digits, so a genuine
 * number beginning with 91 (such as 9123456789) is never mangled.
 */
export const phoneSchema = z
  .string()
  .transform((v) => {
    const digits = v.replace(/\D/g, "");
    if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2); // 919876543210
    if (digits.length === 13 && digits.startsWith("091")) return digits.slice(3); // 0919876543210
    if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1); // 09876543210
    return digits;
  })
  .pipe(z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"));

export const otpCodeSchema = z
  .string()
  .trim()
  .regex(new RegExp(`^\\d{${OTP_LENGTH}}$`), `Enter the ${OTP_LENGTH}-digit code`);

export const otpRequestSchema = z.object({
  phone: phoneSchema,
});
export type OtpRequestInput = z.infer<typeof otpRequestSchema>;

export const otpVerifySchema = z.object({
  phone: phoneSchema,
  otp: otpCodeSchema,
  /** Only used when the phone has no account yet; ignored for existing customers. */
  firstName: z.string().trim().min(2).max(40).optional(),
  lastName: z.string().trim().max(40).optional(),
  /** ADMIN is not in this list on purpose — nobody can make themselves an admin. */
  role: z.enum(SIGNUP_ROLES).optional(),
});
export type OtpVerifyInput = z.infer<typeof otpVerifySchema>;

export const adminLoginSchema = z.object({
  phone: phoneSchema,
  password: z.string().min(1).max(200),
});
export type AdminLoginInput = z.infer<typeof adminLoginSchema>;
