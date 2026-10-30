import {
  OTP_TTL_SECONDS,
  type AdminLoginInput,
  type Customer,
  type LoginResult,
  type OtpRequestInput,
  type OtpRequestResult,
  type OtpVerifyInput,
} from "@agri/shared";
import bcrypt from "bcryptjs";
import { AppError } from "../../common/errors/app-error";
import { logger } from "../../common/logger";
import { REFRESH_TOKEN_TTL_SECONDS, env } from "../../config/env";
import { CustomerModel, type CustomerRecord } from "../customer/customer.model";
import { toCustomer } from "../customer/customer.mapper";
import { customerRepository } from "../customer/customer.repository";
import { authRepository } from "./auth.repository";
import { otpService } from "./otp.service";
import { smsProvider } from "./sms.provider";
import { tokenService } from "./token.service";

/** Where the request came from, used for session records and abuse tracking. */
export type RequestContext = { ip: string | null; userAgent: string | null };

/** Fields needed to create an account. `role` excludes ADMIN by type. */
type NewCustomer = Parameters<typeof customerRepository.create>[0];

export type IssuedTokens = { accessToken: string; refreshToken: string };

/**
 * A real bcrypt hash compared against when the account does not exist, so a wrong phone and a
 * wrong password take the same time. Without it, response timing reveals which phones are admins.
 */
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 12);

/** How long a just-rotated refresh token is still accepted (parallel requests on one page load). */
const ROTATION_GRACE_MS = 30 * 1000;

async function issueTokens(customer: CustomerRecord, ctx: RequestContext): Promise<IssuedTokens> {
  const { raw, hash, familyId } = tokenService.createRefreshToken();
  await authRepository.createSession({
    customerId: customer._id.toString(),
    tokenHash: hash,
    familyId,
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000),
    userAgent: ctx.userAgent,
    ip: ctx.ip,
  });
  return { accessToken: tokenService.signAccessToken(customer), refreshToken: raw };
}

export const authService = {
  /**
   * Step 1 of login. Sends a code and reports whether this phone is new, so the UI knows
   * whether to ask for a name. It never reveals anything else about the account.
   */
  async requestOtp({ phone }: OtpRequestInput, ctx: RequestContext): Promise<OtpRequestResult> {
    const existing = await customerRepository.findByPhone(phone);

    if (existing && !existing.isActive) {
      throw AppError.forbidden("This account has been disabled. Please contact support.", "ACCOUNT_DISABLED");
    }

    // Cooldown, enforced server-side as well as by the UI countdown.
    const { resendIn } = await otpService.timings(phone);
    if (resendIn > 0) {
      throw AppError.tooManyRequests(
        `Please wait ${resendIn} seconds before asking for another code.`,
        "OTP_COOLDOWN",
      );
    }

    const code = await otpService.issue(phone, ctx.ip);
    await smsProvider.sendOtp(phone, code);

    return {
      sent: true,
      isNewUser: !existing,
      expiresInSeconds: OTP_TTL_SECONDS,
      resendAfterSeconds: (await otpService.timings(phone)).resendIn,
      // Development convenience only; env validation forbids this in production.
      ...(env.OTP_DEV_ECHO && { devOtp: code }),
    };
  },

  /** Step 2 of login. Verifies the code, creating the account the first time. */
  async verifyOtp(input: OtpVerifyInput, ctx: RequestContext): Promise<LoginResult & IssuedTokens> {
    const existing = await customerRepository.findByPhone(input.phone);

    // Checked before the code is verified, because verifying consumes it: a missing name
    // must not burn a valid code and force the customer to request another one.
    // Deciding login-vs-signup up front keeps the name requirement provably satisfied below.
    let pending: { kind: "login"; customer: CustomerRecord } | { kind: "signup"; data: NewCustomer };
    if (existing) {
      pending = { kind: "login", customer: existing };
    } else {
      if (!input.firstName) {
        throw AppError.badRequest("Please tell us your name to finish creating your account.", {
          firstName: ["Required for a new account"],
        });
      }
      pending = {
        kind: "signup",
        data: {
          phone: input.phone,
          firstName: input.firstName,
          ...(input.lastName && { lastName: input.lastName }),
          // role comes from SIGNUP_ROLES, so ADMIN can never be self-assigned here.
          role: input.role ?? "CUSTOMER",
        },
      };
    }

    const outcome = await otpService.verify(input.phone, input.otp);

    if (outcome !== "OK") {
      // Deliberately vague messages: they must not say whether the phone has an account.
      const errors = {
        NO_CODE: AppError.unauthorized("Please request a new code.", "OTP_NOT_FOUND"),
        EXPIRED: AppError.unauthorized("That code has expired. Please request a new one.", "OTP_EXPIRED"),
        WRONG_CODE: AppError.unauthorized("That code is incorrect. Please check and try again.", "OTP_INVALID"),
        TOO_MANY_ATTEMPTS: AppError.tooManyRequests(
          "Too many incorrect attempts. Please request a new code.",
          "OTP_ATTEMPTS_EXCEEDED",
        ),
      } as const;
      throw errors[outcome];
    }

    let customer: CustomerRecord;

    if (pending.kind === "signup") {
      const created = await customerRepository.create(pending.data);
      customer = created.toObject() as CustomerRecord;
      logger.info({ customerId: customer._id.toString(), role: customer.role }, "New customer registered");
    } else {
      customer = pending.customer;
      if (!customer.isActive) {
        throw AppError.forbidden("This account has been disabled. Please contact support.", "ACCOUNT_DISABLED");
      }
      if (customer.role === "ADMIN") {
        // Admin access must not rest on SIM possession alone.
        throw AppError.forbidden("Admins must sign in with a password.", "ADMIN_PASSWORD_REQUIRED");
      }
      await customerRepository.markLoggedIn(customer._id.toString());
    }

    const tokens = await issueTokens(customer, ctx);
    return { customer: toCustomer(customer), isNewUser: pending.kind === "signup", ...tokens };
  },

  /** Admins sign in with a password instead of an OTP. */
  async adminLogin({ phone, password }: AdminLoginInput, ctx: RequestContext): Promise<LoginResult & IssuedTokens> {
    const customer = await customerRepository.findByPhoneWithPassword(phone);

    // Always run a comparison, so a missing account and a wrong password take equal time.
    const matches = await bcrypt.compare(password, customer?.passwordHash ?? DUMMY_HASH);

    if (!customer || !customer.passwordHash || !matches || customer.role !== "ADMIN" || !customer.isActive) {
      logger.warn({ phone, ip: ctx.ip }, "Failed admin login");
      // One identical message for every failure reason.
      throw AppError.unauthorized("Incorrect phone number or password.", "INVALID_CREDENTIALS");
    }

    await customerRepository.markLoggedIn(customer._id.toString());
    const tokens = await issueTokens(customer, ctx);
    return { customer: toCustomer(customer), isNewUser: false, ...tokens };
  },

  /**
   * Exchanges a refresh token for a new pair, rotating it.
   * If a token that was already rotated is presented, two parties hold it, so the whole
   * login family is revoked rather than trusting either one.
   */
  async refresh(rawToken: string, ctx: RequestContext): Promise<IssuedTokens> {
    const session = await authRepository.findSessionByHash(tokenService.hashRefreshToken(rawToken));
    if (!session) throw AppError.unauthorized("Your session has ended. Please log in again.", "SESSION_INVALID");

    // A page load fires several requests at once, so the same token can legitimately arrive twice
    // within a moment of being rotated. Only reuse outside that short window is treated as theft.
    const isRecentRotation =
      session.revokedReason === "rotated" &&
      session.revokedAt != null &&
      Date.now() - session.revokedAt.getTime() < ROTATION_GRACE_MS;

    if (session.revokedAt && !isRecentRotation) {
      await authRepository.revokeFamily(session.familyId, "reuse-detected");
      logger.warn({ customerId: session.customerId.toString(), ip: ctx.ip }, "Refresh token reuse detected");
      throw AppError.unauthorized("Your session has ended. Please log in again.", "SESSION_REUSED");
    }

    if (session.expiresAt.getTime() <= Date.now()) {
      throw AppError.unauthorized("Your session has expired. Please log in again.", "SESSION_EXPIRED");
    }

    const customer = await customerRepository.findById(session.customerId.toString());
    if (!customer || !customer.isActive) {
      await authRepository.revokeFamily(session.familyId, "account-inactive");
      throw AppError.unauthorized("Your session has ended. Please log in again.", "SESSION_INVALID");
    }

    const next = tokenService.createRefreshToken();
    // Within the grace window the old token is already rotated; leave its record as it is.
    if (!isRecentRotation) await authRepository.rotateSession(session.tokenHash, next.hash);
    await authRepository.createSession({
      customerId: customer._id.toString(),
      tokenHash: next.hash,
      familyId: session.familyId, // same family, so theft detection still works after rotation
      expiresAt: session.expiresAt, // rotation must not extend the 30-day window
      userAgent: ctx.userAgent,
      ip: ctx.ip,
    });

    return { accessToken: tokenService.signAccessToken(customer), refreshToken: next.raw };
  },

  async logout(rawToken: string | undefined) {
    if (!rawToken) return;
    await authRepository.revokeSession(tokenService.hashRefreshToken(rawToken), "logout");
  },

  /** Ends every session on every device: bumping tokenVersion also kills live access tokens. */
  async logoutEverywhere(customerId: string) {
    await authRepository.revokeAllForCustomer(customerId, "logout-all");
    await CustomerModel.updateOne({ _id: customerId }, { $inc: { tokenVersion: 1 } });
  },

  async me(customerId: string): Promise<Customer> {
    const customer = await customerRepository.findById(customerId);
    if (!customer || !customer.isActive) throw AppError.unauthorized();
    return toCustomer(customer);
  },
};
