import { DEFAULT_LOCALE, type Locale, type Navigation, type NavigationKey, type Page, type SiteSettings } from "@agri/shared";
import { cacheLife, cacheTag } from "next/cache";
import { apiGet, toQueryString } from "./http";

// CMS content is cached for a minute: edits in the database show up within ~1 minute
// without the API being hit on every page view. Tag "content" can be revalidated on demand later.

export async function getSiteSettings(locale: Locale = DEFAULT_LOCALE) {
  "use cache";
  cacheLife("minutes");
  cacheTag("content");
  return apiGet<SiteSettings>(`/content/settings${toQueryString({ locale })}`);
}

export async function getNavigation(key: NavigationKey, locale: Locale = DEFAULT_LOCALE) {
  "use cache";
  cacheLife("minutes");
  cacheTag("content");
  return apiGet<Navigation>(`/content/navigation/${key}${toQueryString({ locale })}`);
}

export async function getPage(slug: string, locale: Locale = DEFAULT_LOCALE) {
  "use cache";
  cacheLife("minutes");
  cacheTag("content");
  return apiGet<Page>(`/content/pages/${encodeURIComponent(slug)}${toQueryString({ locale })}`);
}
