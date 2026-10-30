import { Schema, model, type InferSchemaType, type Types } from "mongoose";

/**
 * A pending OTP challenge. Security notes:
 *  - `codeHash` only: the digits are never stored, so a database leak cannot reveal codes.
 *  - `expiresAt` has a TTL index, so MongoDB deletes expired rows itself — no cleanup job.
 *  - `attempts` burns the code after too many wrong guesses, stopping brute force.
 *  - `consumedAt` makes a code single-use, so a code seen over someone's shoulder is useless twice.
 */
const otpSchema = new Schema(
  {
    phone: { type: String, required: true, match: /^[6-9]\d{9}$/ },
    codeHash: { type: String, required: true },
    attempts: { type: Number, default: 0 },
    consumedAt: { type: Date, default: null },
    expiresAt: { type: Date, required: true },
    requestIp: { type: String, default: null }, // for abuse investigation
    createdAt: { type: Date, default: Date.now },
  },
  { collection: "otp_verifications" },
);

// Newest challenge for a phone is found first.
otpSchema.index({ phone: 1, createdAt: -1 });
// MongoDB removes each document the moment expiresAt passes.
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type OtpRecord = InferSchemaType<typeof otpSchema> & { _id: Types.ObjectId };
export const OtpModel = model("OtpVerification", otpSchema);
