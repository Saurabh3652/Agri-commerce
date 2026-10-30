import type { ApiResponse } from "@agri/shared";

// Server components call the API over the internal URL; the browser uses the public one.
const BASE_URL =
  typeof window === "undefined"
    ? (process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL)
    : process.env.NEXT_PUBLIC_API_URL;

export class ApiRequestError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    /** Field errors ({ phone: ["…"] }) or, for CART_CHANGED, the re-priced quote. */
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

type QueryValue = string | number | boolean | string[] | undefined;

export function toQueryString(query: Record<string, QueryValue>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === "" || (Array.isArray(value) && value.length === 0)) continue;
    params.set(key, Array.isArray(value) ? value.join(",") : String(value));
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function apiUrl(path: string): string {
  if (!BASE_URL) throw new Error("API_URL / NEXT_PUBLIC_API_URL is not set");
  return `${BASE_URL}${path}`;
}

/** Unwraps the `{ success, data }` envelope, throwing ApiRequestError when the API reports a failure. */
export async function unwrap<T>(res: Response): Promise<T> {
  let body: ApiResponse<T>;
  try {
    body = (await res.json()) as ApiResponse<T>;
  } catch {
    throw new ApiRequestError(res.status, "INVALID_RESPONSE", `Unexpected response from API (${res.status})`);
  }
  if (!body.success) {
    throw new ApiRequestError(
      res.status,
      body.error.code,
      body.error.message,
      body.error.details,
    );
  }
  return body.data;
}

/** Public GET, used by cached server-side readers. Sends no credentials. */
export async function apiGet<T>(path: string, init?: RequestInit): Promise<T> {
  return unwrap<T>(await fetch(apiUrl(path), { ...init, headers: { Accept: "application/json", ...init?.headers } }));
}
