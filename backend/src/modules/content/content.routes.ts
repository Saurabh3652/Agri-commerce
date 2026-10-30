import { NAVIGATION_KEYS, localeQuerySchema, pageSlugParamSchema, type Locale, type NavigationKey } from "@agri/shared";
import { Router, type Response } from "express";
import { z } from "zod";
import { sendOk } from "../../common/http/response";
import { validate } from "../../common/middleware/validate";
import { contentService } from "./content.service";

// Mounted at /api/v1/content. Every route accepts ?locale=en|gu (defaults to en).
export const contentRoutes = Router();

const withLocale = validate(localeQuerySchema, "query");
const navigationParams = validate(z.object({ key: z.enum(NAVIGATION_KEYS) }), "params");
const localeOf = (res: Response) => (res.locals.query as { locale: Locale }).locale;

contentRoutes.get("/settings", withLocale, async (_req, res) =>
  sendOk(res, await contentService.getSettings(localeOf(res))),
);

contentRoutes.get("/navigation/:key", navigationParams, withLocale, async (_req, res) => {
  const { key } = res.locals.params as { key: NavigationKey };
  sendOk(res, await contentService.getNavigation(key, localeOf(res)));
});

contentRoutes.get("/pages/:slug", validate(pageSlugParamSchema, "params"), withLocale, async (_req, res) => {
  const { slug } = res.locals.params as { slug: string };
  sendOk(res, await contentService.getPage(slug, localeOf(res)));
});
