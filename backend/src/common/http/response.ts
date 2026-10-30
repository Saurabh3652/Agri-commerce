import type { ApiSuccess } from "@agri/shared";
import type { Response } from "express";

/** Sends `{ success: true, data }` — every successful API response uses this shape. */
export function sendOk<T>(res: Response, data: T, status = 200) {
  const body: ApiSuccess<T> = { success: true, data };
  res.status(status).json(body);
}
