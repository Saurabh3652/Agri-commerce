import type { Paginated, ProductDetail, ProductListItem, ProductSort } from "@agri/shared";
import { apiGet, toQueryString } from "./http";

export type ProductQuery = {
  q?: string;
  category?: string;
  crop?: string;
  featured?: boolean;
  sort?: ProductSort;
  page?: number;
  pageSize?: number;
};

// Not cached on purpose: stock changes often. Render callers inside <Suspense>
// so products stream in fresh on every request.

export function getProducts(query: ProductQuery = {}) {
  return apiGet<Paginated<ProductListItem>>(`/products${toQueryString(query)}`);
}

export function getProduct(slug: string) {
  return apiGet<ProductDetail>(`/products/${encodeURIComponent(slug)}`);
}
