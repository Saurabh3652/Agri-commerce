import type { ApiError } from "@agri/shared";
import type { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import { ZodError, z } from "zod";
import { isProd } from "../../config/env";
import { AppError } from "../errors/app-error";
import { logger } from "../logger";

function sendError(res: Response, status: number, error: ApiError["error"]) {
  const body: ApiError = { success: false, error };
  res.status(status).json(body);
}

export function notFoundHandler(req: Request, res: Response) {
  sendError(res, 404, { code: "ROUTE_NOT_FOUND", message: `${req.method} ${req.path} not found` });
}

// Express 5 sends errors thrown in async handlers here automatically.
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return sendError(res, err.statusCode, { code: err.code, message: err.message, details: err.details });
  }
  if (err instanceof ZodError) {
    return sendError(res, 400, {
      code: "VALIDATION_ERROR",
      message: "Some fields are invalid",
      details: z.flattenError(err).fieldErrors,
    });
  }
  if (err instanceof mongoose.Error.CastError) {
    return sendError(res, 400, { code: "INVALID_ID", message: `Invalid value for ${err.path}` });
  }
  if (err instanceof mongoose.Error.ValidationError) {
    return sendError(res, 400, { code: "VALIDATION_ERROR", message: Object.values(err.errors)[0]?.message ?? err.message });
  }
  // A unique index was violated, e.g. a product slug or SKU that already exists.
  if ((err as { code?: number }).code === 11000) {
    const field = Object.keys((err as { keyValue?: object }).keyValue ?? {})[0] ?? "value";
    return sendError(res, 409, { code: "DUPLICATE", message: `That ${field} is already in use.` });
  }

  logger.error({ err, path: req.path }, "Unhandled error");
  sendError(res, 500, {
    code: "INTERNAL_ERROR",
    message: isProd ? "Something went wrong" : String((err as Error)?.message ?? err),
  });
}
