import { adminLoginSchema, otpRequestSchema, otpVerifySchema } from "@agri/shared";
import { Router } from "express";
import { requireAuth } from "../../common/middleware/auth";
import {
  adminLoginLimiter,
  otpRequestByIpLimiter,
  otpRequestByPhoneLimiter,
  otpVerifyLimiter,
} from "../../common/middleware/rate-limit";
import { validate } from "../../common/middleware/validate";
import { authController } from "./auth.controller";

// Mounted at /api/v1/auth
export const authRoutes = Router();

authRoutes.post(
  "/otp/request",
  otpRequestByIpLimiter,
  otpRequestByPhoneLimiter,
  validate(otpRequestSchema),
  authController.requestOtp,
);

authRoutes.post("/otp/verify", otpVerifyLimiter, validate(otpVerifySchema), authController.verifyOtp);

authRoutes.post("/admin/login", adminLoginLimiter, validate(adminLoginSchema), authController.adminLogin);

authRoutes.post("/refresh", authController.refresh);
authRoutes.post("/logout", authController.logout);
authRoutes.post("/logout-all", requireAuth, authController.logoutEverywhere);
authRoutes.get("/me", requireAuth, authController.me);
