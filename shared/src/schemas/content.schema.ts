// CMS content shapes. Each schema is the single source of truth:
//  - the backend validates content read from MongoDB with it (a bad edit can't break the site)
//  - the TypeScript types in types/content.ts are inferred from it
import { z } from "zod";
import { DEFAULT_LOCALE, ICON_NAMES, PRODUCT_SORTS, SUPPORTED_LOCALES } from "../constants";

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use a 6-digit hex colour like #1f7a3a");
const icon = z.enum(ICON_NAMES);

export const pageSlugParamSchema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid page"),
});

export const localeQuerySchema = z.object({
  locale: z.enum(SUPPORTED_LOCALES).default(DEFAULT_LOCALE),
});

export const linkSchema = z.object({
  label: z.string().min(1),
  href: z.string().min(1),
});

// ---------- Site settings (one document per locale) ----------
export const siteSettingsSchema = z.object({
  siteName: z.string().min(1),
  tagline: z.string().nullable(),
  logoUrl: z.string().nullable(),
  theme: z.object({
    primaryColor: hexColor, // buttons, header
    primaryDarkColor: hexColor, // hover states, footer
    accentColor: hexColor, // highlights, badges, search button
  }),
  contact: z.object({
    phone: z.string().nullable(),
    whatsapp: z.string().nullable(), // digits with country code, e.g. 919999999999
    email: z.string().nullable(),
    hours: z.string().nullable(),
  }),
  header: z.object({
    showSearch: z.boolean(),
    searchPlaceholder: z.string(),
  }),
  footer: z.object({
    about: z.string().nullable(),
    copyright: z.string(),
  }),
  seo: z.object({
    title: z.string(),
    description: z.string(),
  }),
});

// ---------- Navigation menus ----------
export const navItemSchema = z.object({
  label: z.string().min(1),
  href: z.string().min(1),
  icon: icon.nullable().default(null),
  // One level of children: footer columns, or dropdowns later
  children: z.array(linkSchema).default([]),
});

export const navigationSchema = z.object({
  key: z.string(),
  items: z.array(navItemSchema),
});

// ---------- Page sections ----------
// To add a new kind of section: add a schema here, add it to pageSectionSchema,
// and register a component for it in frontend/components/sections/SectionRenderer.tsx.

export const heroSectionSchema = z.object({
  id: z.string(),
  type: z.literal("hero"),
  data: z.object({
    eyebrow: z.string().nullable().default(null),
    title: z.string().min(1),
    subtitle: z.string().nullable().default(null),
    primaryCta: linkSchema.nullable().default(null),
    secondaryCta: linkSchema.nullable().default(null),
    backgroundImageUrl: z.string().nullable().default(null),
    highlights: z.array(z.object({ icon, label: z.string().min(1) })).default([]),
  }),
});

export const categoryGridSectionSchema = z.object({
  id: z.string(),
  type: z.literal("categoryGrid"),
  data: z.object({
    title: z.string().min(1),
    /** Leave empty to show every active category. */
    categorySlugs: z.array(z.string()).default([]),
  }),
});

export const productGridSectionSchema = z.object({
  id: z.string(),
  type: z.literal("productGrid"),
  data: z.object({
    title: z.string().min(1),
    /** Lets buttons link to this section, e.g. anchor "featured" -> href "#featured". */
    anchor: z.string().regex(/^[a-z0-9-]+$/).nullable().default(null),
    viewAllLink: linkSchema.nullable().default(null),
    query: z.object({
      category: z.string().optional(),
      featured: z.boolean().optional(),
      sort: z.enum(PRODUCT_SORTS).default("newest"),
      limit: z.number().int().min(1).max(40).default(8),
    }),
  }),
});

/** Plain text content such as help and policy pages. Each paragraph is a separate string. */
export const richTextSectionSchema = z.object({
  id: z.string(),
  type: z.literal("richText"),
  data: z.object({
    title: z.string().min(1),
    paragraphs: z.array(z.string().min(1)).min(1),
  }),
});

export const pageSectionSchema = z.discriminatedUnion("type", [
  heroSectionSchema,
  categoryGridSectionSchema,
  productGridSectionSchema,
  richTextSectionSchema,
]);

export const SECTION_TYPES = pageSectionSchema.options.map((o) => o.shape.type.value);
