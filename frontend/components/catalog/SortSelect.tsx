"use client";

import { PRODUCT_SORTS, type ProductSort } from "@agri/shared";
import { useRouter } from "next/navigation";
import { t } from "@/lib/i18n";

/** Changing the sort reloads the list from page 1 with the new order. */
export default function SortSelect({ value, hrefFor }: { value: ProductSort; hrefFor: Record<ProductSort, string> }) {
  const router = useRouter();
  return (
    <label className="flex items-center gap-2 text-base">
      <span className="text-ink-muted">{t.catalog.sortBy}</span>
      <select
        value={value}
        onChange={(e) => router.push(hrefFor[e.target.value as ProductSort])}
        className="h-11 rounded-xl border-2 border-line bg-white px-3 text-base font-medium focus:border-brand-600 focus:outline-none"
      >
        {PRODUCT_SORTS.map((sort) => (
          <option key={sort} value={sort}>
            {t.catalog.sort[sort]}
          </option>
        ))}
      </select>
    </label>
  );
}
