import { DEFAULT_LOCALE, type Locale, type Navigation, type NavigationKey, type Page, type SiteSettings } from "@agri/shared";
import { AppError } from "../../common/errors/app-error";
import { toNavigation, toPage, toSiteSettings } from "./content.mapper";
import { contentRepository } from "./content.repository";

/**
 * Looks up content in the requested language and falls back to the default language
 * (English) when it hasn't been translated yet. This lets Gujarati be added gradually.
 */
async function withLocaleFallback<T>(locale: Locale, find: (l: Locale) => Promise<T | null>): Promise<T | null> {
  const doc = await find(locale);
  if (doc || locale === DEFAULT_LOCALE) return doc;
  return find(DEFAULT_LOCALE);
}

export const contentService = {
  async getSettings(locale: Locale): Promise<SiteSettings> {
    const doc = await withLocaleFallback(locale, (l) => contentRepository.findSettings(l));
    if (!doc) throw AppError.notFound("Site settings");
    return toSiteSettings(doc);
  },

  async getNavigation(key: NavigationKey, locale: Locale): Promise<Navigation> {
    const doc = await withLocaleFallback(locale, (l) => contentRepository.findNavigation(key, l));
    if (!doc) throw AppError.notFound(`Navigation "${key}"`);
    return toNavigation(doc);
  },

  async getPage(slug: string, locale: Locale): Promise<Page> {
    const doc = await withLocaleFallback(locale, (l) => contentRepository.findPublishedPage(slug, l));
    if (!doc) throw AppError.notFound(`Page "${slug}"`);
    return toPage(doc);
  },
};
