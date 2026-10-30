import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import { logger } from "./common/logger";
import { errorHandler, notFoundHandler } from "./common/middleware/error-handler";
import { env } from "./config/env";
import { apiRouter } from "./routes";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  // Needed so req.ip is the real client address behind a host's proxy, which rate limiting relies on.
  app.set("trust proxy", 1);

  app.use(helmet());

  // Only our own site may call the API, and only it may send cookies.
  app.use(
    cors({
      origin: env.CORS_ORIGINS,
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    }),
  );

  app.use(compression());

  // JSON only. Accepting form-encoded bodies would open a CSRF path, because
  // simple form posts skip the CORS preflight that protects these endpoints.
  app.use(express.json({ limit: "100kb" }));
  app.use(cookieParser());

  app.use(
    pinoHttp({
      logger,
      autoLogging: { ignore: (req) => req.url === "/api/v1/health" },
      // Never write credentials or tokens to the logs.
      redact: {
        paths: [
          'req.headers.cookie',
          'req.headers.authorization',
          'res.headers["set-cookie"]',
          "req.body.otp",
          "req.body.password",
        ],
        remove: true,
      },
    }),
  );

  app.use("/api/v1", apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
