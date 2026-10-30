import "dotenv/config";
import { z } from "zod";

// Validated once at startup so a missing or weak secret stops the server immediately
// instead of failing later at request time.
const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().default(4000),
    MONGODB_URI: z.string().startsWith("mongodb"),
    CORS_ORIGINS: z
      .string()
      .default("http://localhost:3000")
      .transform((v) => v.split(",").map((s) => s.trim())),

    /** Signs access tokens. Must be long and random: `openssl rand -base64 48`. */
    JWT_ACCESS_SECRET: z.string().min(32, "JWT_ACCESS_SECRET must be at least 32 characters"),
    /** Extra secret mixed into OTP hashes so a database leak alone can't reveal codes. */
    OTP_PEPPER: z.string().min(16, "OTP_PEPPER must be at least 16 characters"),

    /** Set to the shared parent domain in production, e.g. ".agrocommerce.in". */
    COOKIE_DOMAIN: z.string().optional(),

    SMS_PROVIDER: z.enum(["console", "msg91"]).default("console"),
    MSG91_AUTH_KEY: z.string().optional(),
    MSG91_TEMPLATE_ID: z.string().optional(),

    /** Development helper: returns the OTP in the API response so you can test without SMS. */
    OTP_DEV_ECHO: z
      .enum(["true", "false"])
      .default("false")
      .transform((v) => v === "true"),

    /** Used by the seed script to create the first admin account. */
    ADMIN_PHONE: z.string().regex(/^[6-9]\d{9}$/).optional(),
    ADMIN_PASSWORD: z.string().min(8).optional(),
  })
  .superRefine((cfg, ctx) => {
    if (cfg.NODE_ENV !== "production") return;
    // Production-only guards: these mistakes are easy to make and dangerous.
    if (cfg.OTP_DEV_ECHO) {
      ctx.addIssue({ code: "custom", path: ["OTP_DEV_ECHO"], message: "must be false in production" });
    }
    if (cfg.SMS_PROVIDER === "console") {
      ctx.addIssue({ code: "custom", path: ["SMS_PROVIDER"], message: "set a real SMS provider in production" });
    }
    if (cfg.SMS_PROVIDER === "msg91" && !cfg.MSG91_AUTH_KEY) {
      ctx.addIssue({ code: "custom", path: ["MSG91_AUTH_KEY"], message: "required when SMS_PROVIDER=msg91" });
    }
    if (cfg.CORS_ORIGINS.some((o) => o.startsWith("http://"))) {
      ctx.addIssue({ code: "custom", path: ["CORS_ORIGINS"], message: "must use https in production" });
    }
  });

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error("Invalid environment variables:", z.flattenError(parsed.error).fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export const isProd = env.NODE_ENV === "production";

/** Access token lifetime. Short, because a stolen one stays useful only this long. */
export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
/** Refresh token lifetime, so farmers are not asked to log in again every week. */
export const REFRESH_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60;
