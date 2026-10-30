import { z } from "zod";
import { PRODUCT_SORTS } from "../constants";

/** Query string accepted by GET /products. Strings from the URL are converted to numbers/booleans here. */
export const productListQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  category: z.string().trim().max(60).optional(), // category slug
  crop: z.string().trim().toLowerCase().max(40).optional(),
  // z.coerce.boolean() would turn the string "false" into true, so parse it explicitly
  featured: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
  sort: z.enum(PRODUCT_SORTS).default("newest"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(60).default(20),
});

export type ProductListQuery = z.infer<typeof productListQuerySchema>;

/** Query string accepted by GET /categories. `slugs` is a comma-separated list, e.g. "seeds,tools". */
export const categoryListQuerySchema = z.object({
  slugs: z
    .string()
    .optional()
    .transform((v) => (v ? v.split(",").map((s) => s.trim()).filter(Boolean) : [])),
});

export type CategoryListQuery = z.infer<typeof categoryListQuerySchema>;
