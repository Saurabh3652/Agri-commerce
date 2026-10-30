import { discountPercent, formatPaise, type ProductListItem } from "@agri/shared";
import Link from "next/link";
import { getStoreConfig } from "@/lib/api/store.client";
import { toCartItem } from "@/lib/cart/cart-item";
import { t } from "@/lib/i18n";
import AddToCartButton from "./AddToCartButton";

export default async function ProductCard({ product }: { product: ProductListItem }) {
  const { lowStockThreshold } = await getStoreConfig(); // cached, so every card shares one request
  const variant = product.defaultVariant;
  const off = variant ? discountPercent(variant.pricePaise, variant.mrpPaise) : 0;
  const stock = variant?.stock ?? 0;
  const href = `/products/${product.slug}`;

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-sm transition hover:shadow-md">
      <Link href={href} className="relative block aspect-[4/3] bg-brand-50">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- switch to next/image once the image CDN is configured
          <img src={product.imageUrl} alt={product.name} loading="lazy" className="size-full object-cover" />
        ) : (
          <span className="flex size-full items-center justify-center text-6xl" aria-hidden>
            {product.icon ?? "🌱"}
          </span>
        )}
        {off > 0 && (
          <span className="absolute left-2 top-2 rounded-lg bg-accent-400 px-2 py-1 text-sm font-bold text-ink">
            {t.product.off(off)}
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="text-sm font-medium text-brand-700">{product.category.name}</p>
        <h3 className="text-lg font-semibold leading-snug text-ink">
          <Link href={href} className="hover:underline">
            {product.name}
          </Link>
        </h3>
        {product.brand && <p className="text-sm text-ink-muted">{product.brand}</p>}

        {variant && (
          <div className="mt-1">
            <p className="flex flex-wrap items-baseline gap-x-2">
              <span className="text-2xl font-bold text-ink">{formatPaise(variant.pricePaise)}</span>
              {variant.mrpPaise > variant.pricePaise && (
                <span className="text-base text-ink-muted line-through">{formatPaise(variant.mrpPaise)}</span>
              )}
            </p>
            <p className="text-base text-ink-muted">
              / {variant.label}
              {product.variantCount > 1 && (
                <span className="ml-2 font-medium text-brand-700">
                  {t.product.moreSizes(product.variantCount - 1)}
                </span>
              )}
            </p>
          </div>
        )}

        {product.inStock && stock <= lowStockThreshold && (
          <p className="text-sm font-semibold text-warn">{t.product.onlyLeft(stock)}</p>
        )}

        <div className="mt-auto pt-3">
          <AddToCartButton item={variant ? toCartItem(product, variant) : null} />
        </div>
      </div>
    </article>
  );
}
