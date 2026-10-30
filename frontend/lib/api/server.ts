import { cookies } from "next/headers";
import { redirect, unstable_rethrow } from "next/navigation";
import { ApiRequestError, apiGet } from "./http";

/**
 * GET from the API as the current visitor, by forwarding their cookies.
 * The API is the only place that validates the session; this never trusts a cookie itself.
 * Reads cookies, so callers render inside <Suspense> and are never cached.
 */
export async function fetchAsVisitor<T>(path: string): Promise<T> {
  const cookieHeader = (await cookies()).toString();
  return apiGet<T>(path, { headers: { Cookie: cookieHeader }, cache: "no-store" });
}

/**
 * For pages that need a signed-in visitor. This is the real page-level guard: in the App
 * Router a page renders in parallel with its layout, so a layout check alone never stops a
 * page from running. An expired session goes to the right login; a wrong role goes home.
 */
export async function serverGet<T>(path: string): Promise<T> {
  try {
    return await fetchAsVisitor<T>(path);
  } catch (err) {
    unstable_rethrow(err);
    if (err instanceof ApiRequestError && err.status === 401) {
      redirect(path.startsWith("/admin") ? "/admin/login" : "/login");
    }
    if (err instanceof ApiRequestError && err.status === 403) redirect("/");
    throw err;
  }
}
