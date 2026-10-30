// Repository = the only place that talks to MongoDB for CMS content.
import type { Locale, NavigationKey } from "@agri/shared";
import { NavigationModel, type NavigationRecord } from "./models/navigation.model";
import { PageModel, type PageRecord } from "./models/page.model";
import { SiteSettingsModel, type SiteSettingsRecord } from "./models/site-settings.model";

export const contentRepository = {
  findSettings(locale: Locale) {
    return SiteSettingsModel.findOne({ locale }).lean<SiteSettingsRecord>();
  },

  findNavigation(key: NavigationKey, locale: Locale) {
    return NavigationModel.findOne({ key, locale }).lean<NavigationRecord>();
  },

  findPublishedPage(slug: string, locale: Locale) {
    return PageModel.findOne({ slug, locale, isPublished: true }).lean<PageRecord>();
  },
};
