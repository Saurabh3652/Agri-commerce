"use client";

import { ApiRequestError, apiUrl, unwrap } from "./http";

/**
 * Browser-side API call.
 *
 * `credentials: "include"` sends the httpOnly auth cookies. Because the access token only
 * lives 15 minutes, a 401 triggers one silent refresh and a single retry, so a farmer is
 * never thrown back to the login screen mid-task.
 */
async function send(path: string, init: RequestInit): Promise<Response> {
  return fetch(apiUrl(path), {
    ...init,
    credentials: "include",
    headers: { Accept: "application/json", ...init.headers },
  });
}

let refreshing: Promise<boolean> | null = null;

/** Shared across concurrent calls, so several 401s cause only one refresh request. */
function refreshSession(): Promise<boolean> {
  refreshing ??= send("/auth/refresh", { method: "POST" })
    .then((res) => res.ok)
    .catch(() => false)
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

export async function apiCall<T>(
  path: string,
  options: { method?: string; body?: unknown; retryOnAuthFailure?: boolean } = {},
): Promise<T> {
  const { method = "GET", body, retryOnAuthFailure = true } = options;
  const init: RequestInit = {
    method,
    ...(body !== undefined && {
      body: JSON.stringify(body),
      // JSON content-type forces a CORS preflight, which is what blocks cross-site (CSRF) posts.
      headers: { "Content-Type": "application/json" },
    }),
  };

  let res = await send(path, init);

  if (res.status === 401 && retryOnAuthFailure && (await refreshSession())) {
    res = await send(path, init);
  }

  return unwrap<T>(res);
}

/** One readable sentence for any failure: the first field error, the API message, or a network hint. */
export function describeError(err: unknown, networkMessage: string): string {
  if (!(err instanceof ApiRequestError)) return networkMessage;
  const fieldErrors = err.details as Record<string, string[] | undefined> | undefined;
  const firstFieldError = err.code === "VALIDATION_ERROR" ? Object.values(fieldErrors ?? {})[0]?.[0] : undefined;
  return firstFieldError ?? err.message;
}

export { ApiRequestError };
