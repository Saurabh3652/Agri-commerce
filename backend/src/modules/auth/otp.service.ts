import { OTP_LENGTH, OTP_MAX_ATTEMPTS, OTP_RESEND_COOLDOWN_SECONDS, OTP_TTL_SECONDS } from "@agri/shared";
import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { env } from "../../config/env";
import { OtpModel } from "./models/otp.model";

/**
 * Generates a code with crypto.randomInt, never Math.random, whose output is
 * predictable and would let an attacker guess the next code.
 */
function generateCode(): string {
  const max = 10 ** OTP_LENGTH;
  return String(randomInt(0, max)).padStart(OTP_LENGTH, "0");
}

/**

 * A 6-digit c * HMAC-SHA256 with a server-side pepper, rather than a plain hash.ode has only a million possibilities, so a plain (or even bcrypt) hash could be
 * brute-forced from a leaked database. Without OTP_PEPPER, which lives outside the database,
 * the hash is useless to an attacker.
 */
function hashCode(phone: string, code: string): string {
  return createHmac("sha256", env.OTP_PEPPER).update(`${phone}:${code}`).digest("hex");
}

function hashesMatch(a: string, b: string): boolean {
  const left = Buffer.from(a, "hex");
  const right = Buffer.from(b, "hex");
  // Constant-time compare so response timing can't leak how much of the hash matched.
  return left.length === right.length && timingSafeEqual(left, right);
}

export type VerifyOutcome = "OK" | "NO_CODE" | "EXPIRED" | "WRONG_CODE" | "TOO_MANY_ATTEMPTS";

export const otpService = {
  /** Creates a challenge, invalidating any earlier unused one for this phone. */
  async issue(phone: string, ip: string | null): Promise<string> {
    const code = generateCode();
    // One live code per phone: requesting a new one must retire the old.
    await OtpModel.updateMany({ phone, consumedAt: null }, { $set: { consumedAt: new Date() } });
    await OtpModel.create({
      phone,
      codeHash: hashCode(phone, code),
      expiresAt: new Date(Date.now() + OTP_TTL_SECONDS * 1000),
      requestIp: ip,
    });
    return code;
  },

  /** Checks a code and consumes it on success. Each call counts as one attempt. */
  async verify(phone: string, code: string): Promise<VerifyOutcome> {
    const challenge = await OtpModel.findOne({ phone, consumedAt: null }).sort({ createdAt: -1 });
    if (!challenge) return "NO_CODE";

    if (challenge.expiresAt.getTime() <= Date.now()) return "EXPIRED";

    if (challenge.attempts >= OTP_MAX_ATTEMPTS) {
      challenge.consumedAt = new Date();
      await challenge.save();
      return "TOO_MANY_ATTEMPTS";
    }

    // Count the attempt before comparing, so a crash can never grant a free guess.
    challenge.attempts += 1;

    if (!hashesMatch(challenge.codeHash, hashCode(phone, code))) {
      const burned = challenge.attempts >= OTP_MAX_ATTEMPTS;
      if (burned) challenge.consumedAt = new Date();
      await challenge.save();
      return burned ? "TOO_MANY_ATTEMPTS" : "WRONG_CODE";
    }

    challenge.consumedAt = new Date(); // single use
    await challenge.save();
    return "OK";
  },

  /**
   * Timing info about the newest live code for this phone:
   * how long it lasts, and how long before another may be requested.
   */
  async timings(phone: string): Promise<{ expiresIn: number; resendIn: number }> {
    const challenge = await OtpModel.findOne({ phone, consumedAt: null }).sort({ createdAt: -1 }).lean();
    if (!challenge) return { expiresIn: 0, resendIn: 0 };
    const secondsSince = (Date.now() - challenge.createdAt.getTime()) / 1000;
    return {
      expiresIn: Math.max(0, Math.round((challenge.expiresAt.getTime() - Date.now()) / 1000)),
      resendIn: Math.max(0, Math.ceil(OTP_RESEND_COOLDOWN_SECONDS - secondsSince)),
    };
  },
};
