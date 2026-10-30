import type { AdminLoginInput, OtpRequestInput, OtpVerifyInput } from "@agri/shared";
import type { Request, Response } from "express";
import { currentUser } from "../../common/middleware/auth";
import { sendOk } from "../../common/http/response";
import { authService, type RequestContext } from "./auth.service";
import { REFRESH_COOKIE, tokenService } from "./token.service";

function contextOf(req: Request): RequestContext {
  return { ip: req.ip ?? null, userAgent: req.headers["user-agent"] ?? null };
}

export const authController = {
  async requestOtp(req: Request, res: Response) {
    const input = res.locals.body as OtpRequestInput;
    sendOk(res, await authService.requestOtp(input, contextOf(req)));
  },

  async verifyOtp(req: Request, res: Response) {
    const input = res.locals.body as OtpVerifyInput;
    const { accessToken, refreshToken, ...result } = await authService.verifyOtp(input, contextOf(req));
    tokenService.setAuthCookies(res, accessToken, refreshToken);
    sendOk(res, result, result.isNewUser ? 201 : 200);
  },

  async adminLogin(req: Request, res: Response) {
    const input = res.locals.body as AdminLoginInput;
    const { accessToken, refreshToken, ...result } = await authService.adminLogin(input, contextOf(req));
    tokenService.setAuthCookies(res, accessToken, refreshToken);
    sendOk(res, result);
  },

  async refresh(req: Request, res: Response) {
    const raw = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    if (!raw) {
      // Clear any stale access cookie so the browser stops sending it.
      tokenService.clearAuthCookies(res);
      sendOk(res, { refreshed: false }, 401);
      return;
    }
    try {
      const { accessToken, refreshToken } = await authService.refresh(raw, contextOf(req));
      tokenService.setAuthCookies(res, accessToken, refreshToken);
      sendOk(res, { refreshed: true });
    } catch (err) {
      tokenService.clearAuthCookies(res); // a bad refresh token must not linger in the browser
      throw err;
    }
  },

  async logout(req: Request, res: Response) {
    await authService.logout(req.cookies?.[REFRESH_COOKIE] as string | undefined);
    tokenService.clearAuthCookies(res);
    sendOk(res, { loggedOut: true });
  },

  async logoutEverywhere(_req: Request, res: Response) {
    await authService.logoutEverywhere(currentUser(res).id);
    tokenService.clearAuthCookies(res);
    sendOk(res, { loggedOut: true });
  },

  async me(_req: Request, res: Response) {
    sendOk(res, { customer: await authService.me(currentUser(res).id) });
  },
};
