"use client";

import { ShoppingCart } from "lucide-react";
import QuantityStepper from "@/components/ui/QuantityStepper";
import type { NewCartItem } from "@/lib/cart/cart-item";
import { useCart } from "@/lib/cart/CartContext";
import { t } from "@/lib/i18n";

/** "Add to cart" that turns into a − / + stepper once the item is in the cart. */
export default function AddToCartButton({ item }: { item: NewCartItem | null }) {
  const { items, addItem, setQuantity, maxPerItem } = useCart();
  const inCart = item && items.find((i) => i.variantId === item.variantId);

  if (!item || item.stock <= 0) {
    return (
      <button
        type="button"
        disabled
        className="h-12 w-full cursor-not-allowed rounded-xl bg-gray-200 text-base font-semibold text-gray-500"
      >
        {t.product.outOfStock}
      </button>
    );
  }

  if (inCart) {
    return (
      <QuantityStepper
        quantity={inCart.quantity}
        max={Math.min(item.stock, maxPerItem)}
        onChange={(quantity) => setQuantity(item.variantId, quantity)}
        label={t.product.inCart(inCart.quantity)}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => addItem(item)}
      className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 text-base font-semibold text-white hover:bg-brand-700 active:scale-[0.98]"
    >
      <ShoppingCart className="size-5" aria-hidden />
      {t.product.addToCart}
    </button>
  );
}
