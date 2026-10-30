"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { cardClass, errorClass, secondaryButtonClass } from "@/components/ui/styles";
import { describeError } from "@/lib/api/browser";
import { checkoutApi } from "@/lib/api/checkout.client";
import { t } from "@/lib/i18n";

/** Two-step cancel (ask, then confirm) so a stray tap can't cancel an order. */
export default function CancelOrderButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [isConfirming, setIsConfirming] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function cancel() {
    setIsCancelling(true);
    setError(null);
    try {
      await checkoutApi.cancelOrder(orderId);
      router.refresh(); // re-render the page with the cancelled order
    } catch (err) {
      setError(describeError(err, t.state.networkError));
      setIsCancelling(false);
    }
  }

  if (!isConfirming) {
    return (
      <button type="button" onClick={() => setIsConfirming(true)} className={`${secondaryButtonClass} w-full`}>
        {t.orders.cancel}
      </button>
    );
  }

  return (
    <div className={`${cardClass} flex flex-col gap-3`}>
      <p className="text-base font-semibold">{t.orders.cancelQuestion}</p>
      {error && <p className={errorClass}>{error}</p>}
      <button
        type="button"
        onClick={() => void cancel()}
        disabled={isCancelling}
        className="h-12 rounded-xl bg-red-700 px-4 text-base font-bold text-white hover:bg-red-800 disabled:opacity-60"
      >
        {isCancelling ? t.orders.cancelling : t.orders.confirmCancel}
      </button>
      <button type="button" onClick={() => setIsConfirming(false)} className={secondaryButtonClass}>
        {t.orders.keep}
      </button>
    </div>
  );
}
