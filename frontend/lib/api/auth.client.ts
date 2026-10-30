"use client";

import type { Customer, LoginResult, OtpRequestResult, SignupRole } from "@agri/shared";
import { apiCall } from "./browser";

export const authApi = {
  requestOtp(phone: string) {
    return apiCall<OtpRequestResult>("/auth/otp/request", { method: "POST", body: { phone } });
  },

  verifyOtp(input: { phone: string; otp: string; firstName?: string; lastName?: string; role?: SignupRole }) {
    return apiCall<LoginResult>("/auth/otp/verify", { method: "POST", body: input });
  },

  adminLogin(phone: string, password: string) {
    return apiCall<LoginResult>("/auth/admin/login", { method: "POST", body: { phone, password } });
  },

  logout() {
    // No retry: if the session is already gone, that is the desired end state.
    return apiCall<{ loggedOut: boolean }>("/auth/logout", { method: "POST", retryOnAuthFailure: false });
  },

  me() {
    return apiCall<{ customer: Customer }>("/auth/me");
  },
};
