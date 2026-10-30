"use client";

import { ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useCart } from "@/lib/cart/CartContext";
import { t } from "@/lib/i18n";

export default function CartButton() {
  const { itemCount } = useCart();

  return (
    <Link
      href="/cart"
      aria-label={`${t.nav.cart} (${itemCount})`}
      className="relative flex h-12 items-center gap-2 rounded-xl px-3 text-white hover:bg-white/10"
    >
      <ShoppingCart className="size-7" aria-hidden />
      <span className="hidden text-base font-semibold sm:inline">{t.nav.cart}</span>
      {itemCount > 0 && (
        <span className="absolute -top-0.5 left-7 flex min-w-6 items-center justify-center rounded-full bg-accent-400 px-1.5 text-sm font-bold text-ink">
          {itemCount > 99 ? "99+" : itemCount}
        </span>
      )}
    </Link>
  );
}
