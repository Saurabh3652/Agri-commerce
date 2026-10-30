import { logger } from "../../common/logger";
import { env } from "../../config/env";

/** Swappable SMS sender. Add a provider by implementing this one method. */
export type SmsProvider = {
  sendOtp(phone: string, code: string): Promise<void>;
};

/** Development provider: prints the code to the API terminal so you can test without SMS or DLT. */
const consoleProvider: SmsProvider = {
  async sendOtp(phone, code) {
    logger.info(`\n  ┌──────────────────────────────────────┐\n  │  OTP for ${phone}: ${code}        │\n  └──────────────────────────────────────┘`);
  },
};

/** MSG91 (India). Needs DLT-approved template registration before it will deliver. */
const msg91Provider: SmsProvider = {
  async sendOtp(phone, code) {
    const res = await fetch("https://control.msg91.com/api/v5/otp", {
      method: "POST",
      headers: { "Content-Type": "application/json", authkey: env.MSG91_AUTH_KEY! },
      body: JSON.stringify({
        template_id: env.MSG91_TEMPLATE_ID,
        mobile: `91${phone}`,
        otp: code,
      }),
    });
    if (!res.ok) {
      // Never include the code in an error log.
      logger.error({ status: res.status, phone }, "MSG91 send failed");
      throw new Error("Could not send the code. Please try again.");
    }
  },
};

export const smsProvider: SmsProvider = env.SMS_PROVIDER === "msg91" ? msg91Provider : consoleProvider;
