"use client";

import { formatPaise } from "@agri/shared";
import { ShoppingBasket, Trash2 } from "lucide-react";
import Link from "next/link";
import QuantityStepper from "@/components/ui/QuantityStepper";
import { useCart } from "@/lib/cart/CartContext";
import { t } from "@/lib/i18n";

export default function CartView() {
  const { items, itemCount, subtotalPaise, isLoaded, maxPerItem, setQuantity, removeItem } = useCart();

  if (!isLoaded) return <div className="h-64 animate-pulse rounded-2xl bg-white" aria-busy="true" />;

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl bg-white p-10 text-center shadow-sm">
        <ShoppingBasket className="size-16 text-brand-600" aria-hidden />
        <h1 className="text-2xl font-bold">{t.cart.empty}</h1>
        <p className="text-base text-ink-muted">{t.cart.emptyHint}</p>
        <Link
          href="/products"
          className="flex h-12 items-center rounded-xl bg-brand-600 px-6 text-base font-bold text-white hover:bg-brand-700"
        >
          {t.cart.startShopping}
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
      <section>
        <h1 className="mb-4 text-2xl font-bold">
          {t.cart.title} <span className="text-lg font-normal text-ink-muted">({t.cart.items(itemCount)})</span>
        </h1>
        <ul className="flex flex-col gap-3">
          {items.map((item) => (
            <li key={item.variantId} className="flex gap-3 rounded-2xl border border-line bg-white p-3 shadow-sm">
              <Link
                href={`/products/${item.productSlug}`}
                className="flex size-20 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-4xl"
                aria-hidden
              >
                {item.icon ?? "🌱"}
              </Link>
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link href={`/products/${item.productSlug}`} className="font-semibold hover:underline">
                      {item.productName}
                    </Link>
                    <p className="text-sm text-ink-muted">
                      {item.variantLabel} · {formatPaise(item.unitPricePaise)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.variantId)}
                    aria-label={`${t.cart.remove} ${item.productName}`}
                    className="flex size-10 shrink-0 items-center justify-center rounded-lg text-ink-muted hover:bg-red-50 hover:text-red-700"
                  >
                    <Trash2 className="size-5" aria-hidden />
                  </button>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div className="w-36">
                    <QuantityStepper
                      size="md"
                      quantity={item.quantity}
                      max={Math.min(item.stock, maxPerItem)}
                      onChange={(quantity) => setQuantity(item.variantId, quantity)}
                    />
                  </div>
                  <p className="text-lg font-bold">{formatPaise(item.unitPricePaise * item.quantity)}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <aside className="h-fit rounded-2xl border border-line bg-white p-5 shadow-sm lg:sticky lg:top-36">
        <div className="flex items-baseline justify-between">
          <span className="text-lg">{t.cart.subtotal}</span>
          <span className="text-2xl font-bold">{formatPaise(subtotalPaise)}</span>
        </div>
        <p className="mt-1 text-sm text-ink-muted">{t.cart.deliveryNote}</p>
        <Link
          href="/checkout"
          className="mt-5 flex h-14 items-center justify-center rounded-xl bg-brand-600 text-lg font-bold text-white hover:bg-brand-700"
        >
          {t.cart.checkout}
        </Link>
      </aside>
    </div>
  );
}
