import type { Metadata } from "next";
import Link from "next/link";
import { notFound, unstable_rethrow } from "next/navigation";
import { Suspense } from "react";
import ProductPurchase from "@/components/product/ProductPurchase";
import { ApiRequestError } from "@/lib/api/http";
import { getProduct } from "@/lib/api/product.client";
import { getStoreConfig } from "@/lib/api/store.client";
import { t } from "@/lib/i18n";

/** Loads the product, turning an API 404 into the site's not-found page. */
async function loadProduct(slug: string) {
  try {
    return await getProduct(slug);
  } catch (err) {
    unstable_rethrow(err);
    if (err instanceof ApiRequestError && err.status === 404) notFound();
    throw err;
  }
}

export async function generateMetadata({ params }: PageProps<"/products/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug).catch(() => null);
  if (!product) return {};
  return {
    title: product.seo.title ?? product.name,
    description: product.seo.description ?? product.description.slice(0, 160),
  };
}

async function ProductView({ params }: { params: PageProps<"/products/[slug]">["params"] }) {
  const { slug } = await params;
  const [product, store] = await Promise.all([loadProduct(slug), getStoreConfig()]);
  const image = product.images[0];

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div className="flex aspect-square items-center justify-center overflow-hidden rounded-2xl border border-line bg-brand-50">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element -- product photos can come from any host
          <img src={image} alt={product.name} className="size-full object-cover" />
        ) : (
          <span className="text-9xl" aria-hidden>
            {product.icon ?? "🌱"}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-5">
        <div>
          <Link
            href={`/products?category=${product.category.slug}`}
            className="text-base font-semibold text-brand-700 hover:underline"
          >
            {product.category.name}
          </Link>
          <h1 className="mt-1 text-3xl font-bold leading-tight text-balance">{product.name}</h1>
          {product.brand && <p className="mt-1 text-lg text-ink-muted">{t.product.brand(product.brand)}</p>}
        </div>

        <ProductPurchase product={product} lowStockThreshold={store.lowStockThreshold} />

        <section className="border-t border-line pt-5">
          <h2 className="text-lg font-bold">{t.product.description}</h2>
          <p className="mt-2 text-base leading-relaxed whitespace-pre-line">{product.description}</p>
        </section>

        {product.usageInstructions && (
          <section className="rounded-xl bg-brand-50 p-4">
            <h2 className="text-lg font-bold">{t.product.howToUse}</h2>
            <p className="mt-2 text-base leading-relaxed whitespace-pre-line">{product.usageInstructions}</p>
          </section>
        )}

        {product.crops.length > 0 && (
          <section>
            <h2 className="text-base font-semibold text-ink-muted">{t.product.suitableFor}</h2>
            <ul className="mt-2 flex flex-wrap gap-2">
              {product.crops.map((crop) => (
                <li key={crop} className="rounded-full bg-white px-3 py-1 text-base capitalize ring-1 ring-line">
                  {crop}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}

export default function ProductPage({ params }: PageProps<"/products/[slug]">) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <Suspense fallback={<div className="h-[32rem] animate-pulse rounded-2xl bg-white" aria-busy="true" />}>
        <ProductView params={params} />
      </Suspense>
    </div>
  );
}
