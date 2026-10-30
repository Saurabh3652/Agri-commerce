import type { NextFunction, Request, Response } from "express";
import type { z } from "zod";

type Source = "body" | "query" | "params";

/**
 * Checks one part of the request against a zod schema before the controller runs.
 * The cleaned value is stored on `res.locals[source]` (Express 5 makes `req.query` read-only).
 * Invalid input throws a ZodError, which the error handler turns into a 400 response.
 */
export function validate(schema: z.ZodType, source: Source = "body") {
  return (req: Request, res: Response, next: NextFunction) => {
    res.locals[source] = schema.parse(req[source]);
    next();
  };
}
