"use client";

import { Minus, Plus } from "lucide-react";
import { t } from "@/lib/i18n";

type Props = {
  quantity: number;
  max: number;
  onChange: (quantity: number) => void;
  label?: string; // e.g. "3 in cart"; defaults to the number
  size?: "md" | "lg";
};

/** Big − / + buttons, easy to hit with a thumb. Going below the minimum is handled by the cart. */
export default function QuantityStepper({ quantity, max, onChange, label, size = "lg" }: Props) {
  const height = size === "lg" ? "h-12" : "h-10";
  return (
    <div className={`flex ${height} items-center justify-between rounded-xl border-2 border-brand-600 bg-brand-50`}>
      <button
        type="button"
        onClick={() => onChange(quantity - 1)}
        aria-label={t.product.decrease}
        className="flex h-full w-12 items-center justify-center rounded-l-lg text-brand-700 hover:bg-brand-100"
      >
        <Minus className="size-5" aria-hidden />
      </button>
      <span className="min-w-10 px-2 text-center text-base font-bold text-brand-800" aria-live="polite">
        {label ?? quantity}
      </span>
      <button
        type="button"
        onClick={() => onChange(quantity + 1)}
        disabled={quantity >= max}
        aria-label={t.product.increase}
        className="flex h-full w-12 items-center justify-center rounded-r-lg text-brand-700 hover:bg-brand-100 disabled:opacity-40"
      >
        <Plus className="size-5" aria-hidden />
      </button>
    </div>
  );
}
