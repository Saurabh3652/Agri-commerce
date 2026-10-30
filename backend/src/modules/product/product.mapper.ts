import type { AdminProduct, ProductDetail, ProductListItem, ProductVariant } from "@agri/shared";
import type { VariantRecord } from "./product.model";
import type { ProductWithCategory } from "./product.repository";

/** Database documents -> API shapes. Inactive variants and internal fields never leave the server. */

function toVariant(v: VariantRecord): ProductVariant {
  return {
    id: v._id.toString(),
    sku: v.sku,
    label: v.label,
    unit: v.unit,
    pricePaise: v.pricePaise,
    mrpPaise: v.mrpPaise,
    minOrderQty: v.minOrderQty,
    stock: v.stock,
  };
}

function activeVariants(p: ProductWithCategory): ProductVariant[] {
  return (p.variants as VariantRecord[])
    .filter((v) => v.isActive)
    .map(toVariant)
    .sort((a, b) => a.pricePaise - b.pricePaise);
}

function toCategoryRef(p: ProductWithCategory) {
  return { id: p.categoryId._id.toString(), slug: p.categoryId.slug, name: p.categoryId.name };
}

export function toProductListItem(p: ProductWithCategory): ProductListItem {
  const variants = activeVariants(p);
  const inStockVariants = variants.filter((v) => v.stock > 0);
  return {
    id: p._id.toString(),
    slug: p.slug,
    name: p.name,
    brand: p.brand ?? null,
    imageUrl: p.images[0] ?? null,
    icon: p.icon ?? null,
    category: toCategoryRef(p),
    defaultVariant: inStockVariants[0] ?? variants[0] ?? null,
    variantCount: variants.length,
    inStock: inStockVariants.length > 0,
  };
}

export function toProductDetail(p: ProductWithCategory): ProductDetail {
  const variants = activeVariants(p);
  return {
    id: p._id.toString(),
    slug: p.slug,
    name: p.name,
    brand: p.brand ?? null,
    icon: p.icon ?? null,
    category: toCategoryRef(p),
    variantCount: variants.length,
    inStock: variants.some((v) => v.stock > 0),
    description: p.description,
    images: p.images,
    crops: p.crops,
    usageInstructions: p.usageInstructions ?? null,
    variants,
    seo: { title: p.seo?.title ?? null, description: p.seo?.description ?? null },
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

/** Everything the admin form edits, including inactive pack sizes and the retailer price. */
export function toAdminProduct(p: ProductWithCategory): AdminProduct {
  return {
    id: p._id.toString(),
    name: p.name,
    slug: p.slug,
    description: p.description,
    brand: p.brand ?? null,
    categoryId: p.categoryId._id.toString(),
    categoryName: p.categoryId.name,
    icon: p.icon ?? null,
    images: p.images,
    crops: p.crops,
    usageInstructions: p.usageInstructions ?? null,
    isActive: p.isActive,
    isFeatured: p.isFeatured,
    variants: (p.variants as VariantRecord[]).map((v) => ({
      id: v._id.toString(),
      sku: v.sku,
      label: v.label,
      unit: v.unit,
      pricePaise: v.pricePaise,
      mrpPaise: v.mrpPaise,
      retailerPricePaise: v.retailerPricePaise ?? null,
      minOrderQty: v.minOrderQty,
      stock: v.stock,
      isActive: v.isActive,
    })),
    updatedAt: p.updatedAt.toISOString(),
  };
}
