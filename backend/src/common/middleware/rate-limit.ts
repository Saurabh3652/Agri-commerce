import type { ApiError } from "@agri/shared";
import type { Request, Response } from "express";
import rateLimit, { ipKeyGenerator, type Options } from "express-rate-limit";

// Abuse limits. These matter a lot for OTP: every SMS costs money, and an unlimited
// verify endpoint would let someone brute-force a 6-digit code.

function limitHandler(code: string, message: string) {
  return (_req: Request, res: Response) => {
    const body: ApiError = { success: false, error: { code, message } };
    res.status(429).json(body);
  };
}

const base: Partial<Options> = {
  standardHeaders: "draft-7",
  legacyHeaders: false,
};

/** Keyed by phone number, so one attacker can't burn through another person's allowance. */
const phoneKey = (req: Request) => {
  const phone = (req.body as { phone?: string })?.phone;
  return typeof phone === "string" && phone.length > 0 ? `phone:${phone}` : ipKeyGenerator(req.ip ?? "");
};

/** 3 codes per phone per 15 minutes. */
export const otpRequestByPhoneLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000,
  limit: 3,
  keyGenerator: phoneKey,
  handler: limitHandler("OTP_RATE_LIMIT", "Too many code requests for this number. Please try again later."),
});

/** 10 codes per IP per hour, to stop one script spraying many numbers. */
export const otpRequestByIpLimiter = rateLimit({
  ...base,
  windowMs: 60 * 60 * 1000,
  limit: 10,
  handler: limitHandler("OTP_RATE_LIMIT", "Too many requests from this device. Please try again later."),
});

/** 10 verify attempts per phone per 15 minutes, on top of the 5-attempt limit per code. */
export const otpVerifyLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000,
  limit: 10,
  keyGenerator: phoneKey,
  handler: limitHandler("OTP_RATE_LIMIT", "Too many attempts. Please request a new code later."),
});

/** Admin password login: deliberately tight. */
export const adminLoginLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000,
  limit: 5,
  keyGenerator: phoneKey,
  handler: limitHandler("LOGIN_RATE_LIMIT", "Too many login attempts. Please try again in 15 minutes."),
});
