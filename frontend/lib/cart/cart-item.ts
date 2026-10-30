import type { ProductListItem, ProductVariant } from "@agri/shared";

/** One line in the browser cart. Prices are for display only; the server re-prices at checkout. */
export type CartItem = {
  variantId: string;
  productId: string;
  productSlug: string;
  productName: string;
  variantLabel: string;
  icon: string | null;
  imageUrl: string | null;
  unitPricePaise: number;
  stock: number;
  minOrderQty: number;
  quantity: number;
};

export type NewCartItem = Omit<CartItem, "quantity">;

/**
 * Builds a cart item from a product and one of its pack sizes.
 * A plain module (not "use client") so server components can call it too.
 */
export function toCartItem(
  product: Pick<ProductListItem, "id" | "slug" | "name" | "icon" | "imageUrl">,
  variant: ProductVariant,
): NewCartItem {
  return {
    variantId: variant.id,
    productId: product.id,
    productSlug: product.slug,
    productName: product.name,
    variantLabel: variant.label,
    icon: product.icon,
    imageUrl: product.imageUrl,
    unitPricePaise: variant.pricePaise,
    stock: variant.stock,
    minOrderQty: variant.minOrderQty,
  };
}
