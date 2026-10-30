import type { ISODateString, Paise } from "./common";

export type Category = {
  id: string;
  slug: string;
  name: string;
  icon: string | null; // emoji shown on category tiles
  imageUrl: string | null;
  parentId: string | null;
  sortOrder: number;
};

/** One sellable pack size of a product, e.g. "Urea – 45 kg bag". */
export type ProductVariant = {
  id: string;
  sku: string;
  label: string;
  unit: string;
  pricePaise: Paise;
  mrpPaise: Paise;
  minOrderQty: number;
  stock: number;
};

/** Small shape used on product cards and listings. */
export type ProductListItem = {
  id: string;
  slug: string;
  name: string;
  brand: string | null;
  imageUrl: string | null;
  icon: string | null;
  category: Pick<Category, "id" | "slug" | "name">;
  /** Cheapest in-stock pack size (or cheapest overall if all are out of stock). */
  defaultVariant: ProductVariant | null;
  variantCount: number;
  inStock: boolean;
};

/** Full shape used on the product page. */
export type ProductDetail = Omit<ProductListItem, "imageUrl" | "defaultVariant"> & {
  description: string;
  images: string[];
  crops: string[];
  usageInstructions: string | null;
  variants: ProductVariant[];
  seo: { title: string | null; description: string | null };
  createdAt: ISODateString;
  updatedAt: ISODateString;
};
