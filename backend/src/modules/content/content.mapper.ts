import {
  navItemSchema,
  pageSectionSchema,
  siteSettingsSchema,
  type Locale,
  type Navigation,
  type Page,
  type PageSection,
  type SiteSettings,
} from "@agri/shared";
import { logger } from "../../common/logger";
import type { NavigationRecord } from "./models/navigation.model";
import type { PageRecord, SectionRecord } from "./models/page.model";
import type { SiteSettingsRecord } from "./models/site-settings.model";

// Content is edited by hand in the database, so every document is checked against the
// shared zod schemas here. A broken section is skipped and logged instead of crashing the page.

export function toSiteSettings(doc: SiteSettingsRecord): SiteSettings {
  return { ...siteSettingsSchema.parse(doc), locale: doc.locale as Locale };
}

export function toNavigation(doc: NavigationRecord): Navigation {
  const items = doc.items
    .filter((item) => item.isActive)
    .flatMap((item) => {
      const result = navItemSchema.safeParse(item);
      if (!result.success) {
        logger.warn({ menu: doc.key, item, issues: result.error.issues }, "Skipping invalid nav item");
        return [];
      }
      return [result.data];
    });
  return { key: doc.key, locale: doc.locale as Locale, items };
}

function toSection(section: SectionRecord, pageSlug: string): PageSection | null {
  const result = pageSectionSchema.safeParse({
    id: section._id.toString(),
    type: section.type,
    data: section.data,
  });
  if (!result.success) {
    logger.warn(
      { page: pageSlug, sectionId: section._id.toString(), type: section.type, issues: result.error.issues },
      "Skipping invalid page section",
    );
    return null;
  }
  return result.data;
}

export function toPage(doc: PageRecord): Page {
  const sections = (doc.sections as SectionRecord[])
    .filter((s) => s.isActive)
    .map((s) => toSection(s, doc.slug))
    .filter((s): s is PageSection => s !== null);

  return {
    slug: doc.slug,
    locale: doc.locale as Locale,
    title: doc.title,
    seo: { title: doc.seo?.title ?? null, description: doc.seo?.description ?? null },
    sections,
  };
}
