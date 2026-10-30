import type { ProductGridSection as ProductGridSectionData } from "@agri/shared";
import { unstable_rethrow } from "next/navigation";
import { Suspense } from "react";
import ProductCard from "@/components/product/ProductCard";
import ProductGridSkeleton, { productGridClass } from "@/components/product/ProductGridSkeleton";
import { getProducts } from "@/lib/api/product.client";
import { t } from "@/lib/i18n";
import SectionHeading from "./SectionHeading";

type Data = ProductGridSectionData["data"];

/** Fetches fresh products (stock changes often) and streams them in. */
async function ProductList({ query }: { query: Data["query"] }) {
  const result = await getProducts({
    category: query.category,
    featured: query.featured,
    sort: query.sort,
    pageSize: query.limit,
  }).catch((err: unknown) => {
    unstable_rethrow(err); // let Next's own prerender signals through
    // A cancelled render aborts its fetches. That is not a failure, so let React discard it quietly.
    if (err instanceof Error && err.name === "AbortError") throw err;
    console.error("Failed to load products", err);
    return null;
  });

  if (!result) return <p className="rounded-xl bg-red-50 p-4 text-base text-red-800">{t.state.productsError}</p>;
  if (result.items.length === 0) {
    return <p className="rounded-xl bg-brand-50 p-4 text-base text-ink-muted">{t.state.noProducts}</p>;
  }

  return (
    <div className={productGridClass}>
      {result.items.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}

export default function ProductGridSection({ data }: { data: Data }) {
  return (
    <section id={data.anchor ?? undefined} className="mx-auto max-w-7xl scroll-mt-36 px-4">
      <SectionHeading title={data.title} link={data.viewAllLink} />
      <Suspense fallback={<ProductGridSkeleton count={Math.min(data.query.limit, 8)} />}>
        <ProductList query={data.query} />
      </Suspense>
    </section>
  );
}
