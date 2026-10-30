import type { SiteSettings } from "@agri/shared";
import type { CSSProperties } from "react";

/**
 * Turns the CMS theme colours into CSS variables on <html>.
 * globals.css derives the lighter/darker shades from these three, so changing
 * three colours in the database re-themes the whole site.
 */
export function themeToCssVars(theme: SiteSettings["theme"]): CSSProperties {
  return {
    "--color-brand-600": theme.primaryColor,
    "--color-brand-700": theme.primaryDarkColor,
    "--color-accent-400": theme.accentColor,
  } as CSSProperties;
}
