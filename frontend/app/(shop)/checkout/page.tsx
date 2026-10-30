import type { Metadata } from "next";
import { Suspense } from "react";
import CheckoutForm from "@/components/checkout/CheckoutForm";
import { requireSession } from "@/lib/auth/session";
import { t } from "@/lib/i18n";

export const metadata: Metadata = { title: "Checkout" };

async function Checkout() {
  // Sends a signed-out visitor to /login and back here afterwards.
  const customer = await requireSession("/checkout");
  return <CheckoutForm customer={customer} />;
}

export default function CheckoutPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="mb-5 text-2xl font-bold">{t.checkout.title}</h1>
      <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-white" aria-busy="true" />}>
        <Checkout />
      </Suspense>
    </div>
  );
}
