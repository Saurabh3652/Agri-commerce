import { z } from "zod";

const paise = z.number().int().min(0);

export const variantInputSchema = z
  .object({
    id: z.string().regex(/^[a-f0-9]{24}$/).optional(), // present when editing an existing pack size
    sku: z.string().trim().toUpperCase().min(2).max(40),
    label: z.string().trim().min(1).max(40),
    unit: z.string().trim().min(1).max(10),
    pricePaise: paise,
    mrpPaise: paise,
    retailerPricePaise: paise.nullable(),
    minOrderQty: z.number().int().min(1).max(999),
    stock: z.number().int().min(0).max(1_000_000),
    isActive: z.boolean(),
  })
  .refine((v) => v.pricePaise <= v.mrpPaise, { message: "Price cannot be above MRP", path: ["pricePaise"] });

export const productInputSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and dashes"),
  description: z.string().trim().min(10).max(4000),
  brand: z.string().trim().max(60).nullable(),
  categoryId: z.string().regex(/^[a-f0-9]{24}$/, "Choose a category"),
  icon: z.string().trim().max(8).nullable(),
  images: z.array(z.url()).max(8),
  crops: z.array(z.string().trim().toLowerCase().min(2)).max(20),
  usageInstructions: z.string().trim().max(4000).nullable(),
  isActive: z.boolean(),
  isFeatured: z.boolean(),
  variants: z.array(variantInputSchema).min(1, "Add at least one pack size").max(20),
});
export type ProductInput = z.infer<typeof productInputSchema>;

export const adminProductListQuerySchema = z.object({
  q: z.string().trim().max(60).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});
export type AdminProductListQuery = z.infer<typeof adminProductListQuerySchema>;
