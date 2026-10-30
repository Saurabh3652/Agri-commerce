import { type NextRequest, NextResponse } from "next/server";

/**
 * Runs before every page request. Two jobs:
 *
 * 1. Keep sessions alive. The access cookie lasts 15 minutes; when it has expired but the
 *    30-day refresh cookie is still present, renew both here, before the page renders,
 *    so server components see a signed-in visitor instead of bouncing them to /login.
 *
 * 2. Fast redirects. Pages that need a login send signed-out visitors to the login page
 *    without first rendering. This is UX only: it checks that a cookie exists, never that
 *    it is valid. Every protected page calls requireSession(), and the API re-checks the
 *    token on every request.
 *
 * Production note: the cookies are set by the API's domain, so COOKIE_DOMAIN must be the
 * shared parent (".yourdomain.in") for this proxy to see them.
 */
const ACCESS_COOKIE = "agri_at";
const REFRESH_COOKIE = "agri_rt";
const CUSTOMER_PAGES = ["/account", "/checkout", "/orders"];
const ADMIN_PAGES = ["/admin"];
const ADMIN_LOGIN = "/admin/login";

const isUnder = (path: string, prefixes: string[]) => prefixes.some((p) => path === p || path.startsWith(`${p}/`));

/** Asks the API for fresh cookies. Returns its Set-Cookie headers (renewed, or cleared on failure). */
async function renewSession(req: NextRequest): Promise<string[]> {
  try {
    const res = await fetch(`${process.env.API_URL}/auth/refresh`, {
      method: "POST",
      headers: { cookie: req.headers.get("cookie") ?? "" },
    });
    return res.headers.getSetCookie();
  } catch {
    return []; // API unreachable: carry on, and the page will treat the visitor as signed out
  }
}

/** Applies Set-Cookie headers to the incoming request, so this render already sees them. */
function applyToRequest(req: NextRequest, setCookies: string[]) {
  for (const header of setCookies) {
    const [pair = ""] = header.split(";");
    const separator = pair.indexOf("=");
    const name = pair.slice(0, separator).trim();
    const value = pair.slice(separator + 1).trim();
    if (value) req.cookies.set(name, value);
    else req.cookies.delete(name); // the API cleared it
  }
}

function redirectTo(req: NextRequest, path: string, returnTo?: string) {
  const url = new URL(path, req.url);
  if (returnTo) url.searchParams.set("next", returnTo);
  return NextResponse.redirect(url);
}

export async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  let renewedCookies: string[] = [];
  if (!req.cookies.has(ACCESS_COOKIE) && req.cookies.has(REFRESH_COOKIE)) {
    renewedCookies = await renewSession(req);
    applyToRequest(req, renewedCookies);
  }

  const isSignedIn = req.cookies.has(ACCESS_COOKIE);
  const returnTo = `${pathname}${search}`;

  let response: NextResponse;
  if (pathname === "/login" && isSignedIn) {
    response = redirectTo(req, "/account");
  } else if (isUnder(pathname, CUSTOMER_PAGES) && !isSignedIn) {
    response = redirectTo(req, "/login", returnTo);
  } else if (isUnder(pathname, ADMIN_PAGES) && pathname !== ADMIN_LOGIN && !isSignedIn) {
    response = redirectTo(req, ADMIN_LOGIN, returnTo);
  } else {
    // Pass the (possibly renewed) cookies on to the page being rendered.
    response = NextResponse.next({ request: { headers: req.headers } });
  }

  // Hand the renewed cookies to the browser as well.
  for (const header of renewedCookies) response.headers.append("set-cookie", header);
  return response;
}

export const config = {
  // Pages only: skip static files, images and Next internals.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|ico)$).*)"],
};
