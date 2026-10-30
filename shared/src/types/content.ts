import type { z } from "zod";
import type { Locale } from "../constants";
import type {
  categoryGridSectionSchema,
  heroSectionSchema,
  linkSchema,
  navItemSchema,
  pageSectionSchema,
  productGridSectionSchema,
  richTextSectionSchema,
  siteSettingsSchema,
} from "../schemas/content.schema";

// Types are inferred from the zod schemas so they can never drift apart.
export type Link = z.infer<typeof linkSchema>;
export type SiteSettings = z.infer<typeof siteSettingsSchema> & { locale: Locale };
export type NavItem = z.infer<typeof navItemSchema>;
export type Navigation = { key: string; locale: Locale; items: NavItem[] };

export type HeroSection = z.infer<typeof heroSectionSchema>;
export type CategoryGridSection = z.infer<typeof categoryGridSectionSchema>;
export type ProductGridSection = z.infer<typeof productGridSectionSchema>;
export type RichTextSection = z.infer<typeof richTextSectionSchema>;
export type PageSection = z.infer<typeof pageSectionSchema>;
export type SectionType = PageSection["type"];

export type Page = {
  slug: string;
  locale: Locale;
  title: string;
  seo: { title: string | null; description: string | null };
  sections: PageSection[];
};
