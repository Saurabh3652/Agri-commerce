"use client";

import { ORDER_STATUS_TRANSITIONS, type OrderStatus } from "@agri/shared";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { cardClass, errorClass, inputClass, labelClass } from "@/components/ui/styles";
import { adminApi } from "@/lib/api/admin.client";
import { describeError } from "@/lib/api/browser";
import { t } from "@/lib/i18n";

/** Offers only the moves the order state machine allows from the current status. */
export default function OrderStatusActions({ orderId, status }: { orderId: string; status: OrderStatus }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [pendingStatus, setPendingStatus] = useState<OrderStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const nextStatuses = ORDER_STATUS_TRANSITIONS[status];

  async function moveTo(next: OrderStatus) {
    setPendingStatus(next);
    setError(null);
    try {
      await adminApi.updateOrderStatus(orderId, { status: next, note: note.trim() || undefined });
      setNote("");
      router.refresh();
    } catch (err) {
      setError(describeError(err, t.state.networkError));
    } finally {
      setPendingStatus(null);
    }
  }

  if (nextStatuses.length === 0) {
    return <p className={`${cardClass} text-base text-ink-muted`}>{t.admin.orders.noFurtherSteps}</p>;
  }

  return (
    <section className={`${cardClass} flex flex-col gap-3`}>
      <h2 className="text-lg font-bold">{t.admin.orders.moveTo}</h2>
      <div>
        <label htmlFor="status-note" className={labelClass}>
          {t.admin.orders.note}
        </label>
        <input id="status-note" value={note} maxLength={300} onChange={(e) => setNote(e.target.value)} className={inputClass} />
      </div>
      {nextStatuses.map((next) => (
        <button
          key={next}
          type="button"
          onClick={() => void moveTo(next)}
          disabled={pendingStatus !== null}
          className={`h-12 rounded-xl px-4 text-base font-bold disabled:opacity-60 ${
            next === "CANCELLED"
              ? "border-2 border-red-200 bg-white text-red-700 hover:bg-red-50"
              : "bg-brand-600 text-white hover:bg-brand-700"
          }`}
        >
          {pendingStatus === next ? t.admin.orders.updating : t.orders.status[next]}
        </button>
      ))}
      {error && <p className={errorClass}>{error}</p>}
    </section>
  );
}
