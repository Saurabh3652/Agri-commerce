import { createHash, randomBytes, randomUUID } from "node:crypto";
import type { CookieOptions, Response } from "express";
import jwt from "jsonwebtoken";
import { ACCESS_TOKEN_TTL_SECONDS, REFRESH_TOKEN_TTL_SECONDS, env, isProd } from "../../config/env";
import type { CustomerRecord } from "../customer/customer.model";

export const ACCESS_COOKIE = "agri_at";
export const REFRESH_COOKIE = "agri_rt";

/**
 * Sent with every request (path "/"), so the website's proxy can renew an expired access
 * token before rendering a page. Scoping it to /api/v1/auth would hide it from page requests,
 * and signed-in customers would appear logged out after 15 minutes.
 */
const REFRESH_COOKIE_PATH = "/";

const JWT_ISSUER = "agri-commerce";

export type AccessTokenPayload = {
  sub: string; // customer id
  role: CustomerRecord["role"];
  tv: number; // tokenVersion, so "log out everywhere" invalidates old tokens
};

function cookieOptions(maxAgeSeconds: number, path = "/"): CookieOptions {
  return {
    httpOnly: true, // JavaScript cannot read it, so XSS cannot steal the session
    secure: isProd, // HTTPS only in production
    sameSite: "lax", // not sent on cross-site requests, which blocks CSRF
    path,
    maxAge: maxAgeSeconds * 1000,
    ...(env.COOKIE_DOMAIN && { domain: env.COOKIE_DOMAIN }),
  };
}

export const tokenService = {
  signAccessToken(customer: Pick<CustomerRecord, "_id" | "role" | "tokenVersion">): string {
    const payload: AccessTokenPayload = {
      sub: customer._id.toString(),
      role: customer.role,
      tv: customer.tokenVersion,
    };
    return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
      issuer: JWT_ISSUER,
      algorithm: "HS256", // pinned, so a forged token can't ask for "none"
    });
  },

  verifyAccessToken(token: string): AccessTokenPayload | null {
    try {
      return jwt.verify(token, env.JWT_ACCESS_SECRET, {
        issuer: JWT_ISSUER,
        algorithms: ["HS256"],
      }) as AccessTokenPayload;
    } catch {
      return null; // expired, tampered with, or signed by something else
    }
  },

  /** 256 bits of randomness. Returned raw for the cookie, hashed for storage. */
  createRefreshToken() {
    const raw = randomBytes(32).toString("base64url");
    return { raw, hash: this.hashRefreshToken(raw), familyId: randomUUID() };
  },

  /** Plain SHA-256 is right here: the token is already high-entropy, so no salt is needed. */
  hashRefreshToken(raw: string): string {
    return createHash("sha256").update(raw).digest("hex");
  },

  setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
    res.cookie(ACCESS_COOKIE, accessToken, cookieOptions(ACCESS_TOKEN_TTL_SECONDS));
    res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions(REFRESH_TOKEN_TTL_SECONDS, REFRESH_COOKIE_PATH));
  },

  clearAuthCookies(res: Response) {
    res.clearCookie(ACCESS_COOKIE, { ...cookieOptions(0), maxAge: undefined });
    res.clearCookie(REFRESH_COOKIE, { ...cookieOptions(0, REFRESH_COOKIE_PATH), maxAge: undefined });
  },
};
