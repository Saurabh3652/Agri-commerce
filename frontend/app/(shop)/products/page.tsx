import { PRODUCT_SORTS, productListQuerySchema, type ProductListQuery, type ProductSort } from "@agri/shared";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import Pagination from "@/components/catalog/Pagination";
import SortSelect from "@/components/catalog/SortSelect";
import ProductCard from "@/components/product/ProductCard";
import ProductGridSkeleton, { productGridClass } from "@/components/product/ProductGridSkeleton";
import { getCategories } from "@/lib/api/category.client";
import { getProducts } from "@/lib/api/product.client";
import { firstParam } from "@/lib/format";
import { t } from "@/lib/i18n";

export const metadata: Metadata = { title: "Products" };

const PAGE_SIZE = 24;

/** Builds a /products link that keeps the current filters and changes only what is passed. */
function catalogHref(current: ProductListQuery, changes: Partial<ProductListQuery>) {
  const next = { ...current, ...changes };
  const params = new URLSearchParams();
  if (next.q) params.set("q", next.q);
  if (next.category) params.set("category", next.category);
  if (next.featured) params.set("featured", "true");
  if (next.sort !== "newest") params.set("sort", next.sort);
  if (next.page > 1) params.set("page", String(next.page));
  const query = params.toString();
  return query ? `/products?${query}` : "/products";
}

async function ProductResults({ searchParams }: { searchParams: PageProps<"/products">["searchParams"] }) {
  const raw = await searchParams;
  // Reuses the API's own validation, so a hand-edited URL falls back to safe defaults.
  const parsed = productListQuerySchema.safeParse({
    q: firstParam(raw.q),
    category: firstParam(raw.category),
    featured: firstParam(raw.featured),
    sort: firstParam(raw.sort),
    page: firstParam(raw.page),
    pageSize: PAGE_SIZE,
  });
  const query = parsed.success ? parsed.data : productListQuerySchema.parse({ pageSize: PAGE_SIZE });

  const [result, categories] = await Promise.all([getProducts(query), getCategories()]);
  const activeCategory = categories.find((c) => c.slug === query.category);
  const title = query.q
    ? t.catalog.resultsFor(query.q)
    : (activeCategory?.name ?? (query.featured ? t.catalog.offers : t.catalog.allProducts));

  const chip = (isActive: boolean) =>
    `flex h-11 shrink-0 items-center gap-2 rounded-full border-2 px-4 text-base font-medium ${
      isActive ? "border-brand-600 bg-brand-600 text-white" : "border-line bg-white text-ink hover:border-brand-600"
    }`;
  const sortHrefs = Object.fromEntries(
    PRODUCT_SORTS.map((sort) => [sort, catalogHref(query, { sort, page: 1 })]),
  ) as Record<ProductSort, string>;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
          <p className="mt-1 text-base text-ink-muted">{t.catalog.count(result.total)}</p>
        </div>
        <SortSelect value={query.sort} hrefFor={sortHrefs} />
      </div>

      <nav aria-label={t.nav.menu} className="-mx-4 mt-5 overflow-x-auto px-4 [scrollbar-width:none]">
        <ul className="flex gap-2">
          <li>
            <Link href={catalogHref(query, { category: undefined, page: 1 })} className={chip(!query.category)}>
              {t.catalog.all}
            </Link>
          </li>
          {categories.map((c) => (
            <li key={c.id}>
              <Link href={catalogHref(query, { category: c.slug, page: 1 })} className={chip(c.slug === query.category)}>
                <span aria-hidden>{c.icon}</span>
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {result.items.length === 0 ? (
        <p className="mt-8 rounded-xl bg-brand-50 p-6 text-center text-lg text-ink-muted">{t.state.noProducts}</p>
      ) : (
        <div className={`mt-6 ${productGridClass}`}>
          {result.items.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      <Pagination
        page={result.page}
        totalPages={result.totalPages}
        hrefFor={(page) => catalogHref(query, { page })}
      />
    </>
  );
}

export default function ProductsPage({ searchParams }: PageProps<"/products">) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <Suspense fallback={<ProductGridSkeleton count={8} />}>
        <ProductResults searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
