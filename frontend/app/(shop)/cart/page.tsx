import type { Metadata } from "next";
import CartView from "@/components/cart/CartView";

export const metadata: Metadata = { title: "Cart" };

export default function CartPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <CartView />
    </div>
  );
}
