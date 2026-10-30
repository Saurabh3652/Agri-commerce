"use client";

import { discountPercent, formatPaise, type ProductDetail } from "@agri/shared";
import { useState } from "react";
import { toCartItem } from "@/lib/cart/cart-item";
import { t } from "@/lib/i18n";
import AddToCartButton from "./AddToCartButton";

/** Pack-size picker plus price and add-to-cart for the product page. */
export default function ProductPurchase({ product, lowStockThreshold }: { product: ProductDetail; lowStockThreshold: number }) {
  // Start on the cheapest pack that is in stock.
  const [variantId, setVariantId] = useState(
    () => (product.variants.find((v) => v.stock > 0) ?? product.variants[0])?.id,
  );
  const variant = product.variants.find((v) => v.id === variantId);
  if (!variant) return null;

  const off = discountPercent(variant.pricePaise, variant.mrpPaise);
  const cartItem = toCartItem({ ...product, imageUrl: product.images[0] ?? null }, variant);

  return (
    <div className="flex flex-col gap-5">
      {product.variants.length > 1 && (
        <fieldset>
          <legend className="mb-2 text-base font-semibold">{t.product.chooseSize}</legend>
          <div className="flex flex-wrap gap-2">
            {product.variants.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setVariantId(v.id)}
                aria-pressed={v.id === variantId}
                className={`min-h-12 rounded-xl border-2 px-4 py-2 text-left text-base ${
                  v.id === variantId ? "border-brand-600 bg-brand-50 font-semibold" : "border-line bg-white"
                } ${v.stock <= 0 ? "opacity-50" : ""}`}
              >
                {v.label}
                <span className="block text-sm text-ink-muted">{formatPaise(v.pricePaise)}</span>
              </button>
            ))}
          </div>
        </fieldset>
      )}

      <div>
        <p className="flex flex-wrap items-baseline gap-x-3">
          <span className="text-3xl font-bold">{formatPaise(variant.pricePaise)}</span>
          {variant.mrpPaise > variant.pricePaise && (
            <>
              <span className="text-lg text-ink-muted line-through">
                {t.product.mrp} {formatPaise(variant.mrpPaise)}
              </span>
              <span className="rounded-lg bg-accent-400 px-2 py-0.5 text-sm font-bold text-ink">{t.product.off(off)}</span>
            </>
          )}
        </p>
        <p className="mt-1 text-base text-ink-muted">/ {variant.label}</p>
        <p className={`mt-2 text-base font-semibold ${variant.stock <= lowStockThreshold ? "text-warn" : "text-brand-700"}`}>
          {variant.stock <= 0
            ? t.product.outOfStock
            : variant.stock <= lowStockThreshold
              ? t.product.onlyLeft(variant.stock)
              : t.product.inStock}
        </p>
      </div>

      <div className="max-w-sm">
        <AddToCartButton item={cartItem} />
      </div>
    </div>
  );
}
