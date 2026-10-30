import type { Role } from "@agri/shared";
import type { NextFunction, Request, Response } from "express";
import { customerRepository } from "../../modules/customer/customer.repository";
import { ACCESS_COOKIE, tokenService } from "../../modules/auth/token.service";
import { AppError } from "../errors/app-error";

/** The authenticated caller, attached to res.locals by requireAuth. */
export type AuthUser = { id: string; role: Role };

function readAccessToken(req: Request): string | undefined {
  // Cookie first (browsers). The Bearer header is for a future mobile app and for curl testing.
  const fromCookie = req.cookies?.[ACCESS_COOKIE] as string | undefined;
  if (fromCookie) return fromCookie;
  const header = req.headers.authorization;
  return header?.startsWith("Bearer ") ? header.slice(7) : undefined;
}

/**
 * Rejects the request unless a valid access token is present.
 * The token is only trusted after its signature, expiry and tokenVersion all check out,
 * and after the account is confirmed to still be active.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = readAccessToken(req);
  if (!token) throw AppError.unauthorized();

  const payload = tokenService.verifyAccessToken(token);
  if (!payload) throw AppError.unauthorized("Your session has expired. Please log in again.", "TOKEN_INVALID");

  // Checked on every request so disabling an account, or "log out everywhere",
  // takes effect immediately instead of waiting for the token to expire.
  const customer = await customerRepository.findById(payload.sub);
  if (!customer || !customer.isActive || customer.tokenVersion !== payload.tv) {
    throw AppError.unauthorized("Your session has ended. Please log in again.", "SESSION_INVALID");
  }

  res.locals.user = { id: customer._id.toString(), role: customer.role } satisfies AuthUser;
  next();
}

/** Use after requireAuth. Server-side role check — hiding links in the UI is not security. */
export function requireRole(...allowed: Role[]) {
  return (_req: Request, res: Response, next: NextFunction) => {
    const user = res.locals.user as AuthUser | undefined;
    if (!user) throw AppError.unauthorized();
    if (!allowed.includes(user.role)) throw AppError.forbidden();
    next();
  };
}

/** Reads res.locals.user inside a controller that is already behind requireAuth. */
export function currentUser(res: Response): AuthUser {
  const user = res.locals.user as AuthUser | undefined;
  if (!user) throw AppError.unauthorized();
  return user;
}
