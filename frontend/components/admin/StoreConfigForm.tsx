"use client";

import { paiseToRupees, rupeesToPaise, storeConfigSchema, type StoreConfig } from "@agri/shared";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { cardClass, errorClass, inputClass, labelClass, primaryButtonClass } from "@/components/ui/styles";
import { adminApi } from "@/lib/api/admin.client";
import { describeError } from "@/lib/api/browser";
import { t } from "@/lib/i18n";

const s = t.admin.settings;

// Money fields are typed in rupees and stored in paise.
const MONEY_FIELDS = [
  { key: "codMaxOrderPaise", label: s.codMax },
  { key: "minOrderPaise", label: s.minOrder },
  { key: "freeDeliveryAbovePaise", label: s.freeDelivery },
] as const;
const NUMBER_FIELDS = [
  { key: "maxQuantityPerItem", label: s.maxQty },
  { key: "lowStockThreshold", label: s.lowStock },
] as const;
const TEXT_FIELDS = [
  { key: "orderNumberPrefix", label: s.prefix },
  { key: "timezone", label: s.timezone },
] as const;

type Draft = Record<string, string> & { codEnabled: string };

function draftFrom(config: StoreConfig): Draft {
  return {
    codEnabled: String(config.codEnabled),
    ...Object.fromEntries(MONEY_FIELDS.map(({ key }) => [key, String(paiseToRupees(config[key]))])),
    ...Object.fromEntries(NUMBER_FIELDS.map(({ key }) => [key, String(config[key])])),
    ...Object.fromEntries(TEXT_FIELDS.map(({ key }) => [key, config[key]])),
  };
}

export default function StoreConfigForm({ config }: { config: StoreConfig }) {
  const router = useRouter();
  const [draft, setDraft] = useState(() => draftFrom(config));
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  async function save(e: FormEvent) {
    e.preventDefault();
    const parsed = storeConfigSchema.safeParse({
      codEnabled: draft.codEnabled === "true",
      ...Object.fromEntries(MONEY_FIELDS.map(({ key }) => [key, rupeesToPaise(Number(draft[key]))])),
      ...Object.fromEntries(NUMBER_FIELDS.map(({ key }) => [key, Number(draft[key])])),
      ...Object.fromEntries(TEXT_FIELDS.map(({ key }) => [key, draft[key]])),
    });
    if (!parsed.success) {
      const issue = parsed.error.issues[0]!;
      setMessage({ tone: "error", text: `${String(issue.path[0])}: ${issue.message}` });
      return;
    }
    setIsSaving(true);
    setMessage(null);
    try {
      const saved = await adminApi.saveStoreConfig(parsed.data);
      setDraft(draftFrom(saved));
      setMessage({ tone: "ok", text: s.saved });
      router.refresh();
    } catch (err) {
      setMessage({ tone: "error", text: describeError(err, t.state.networkError) });
    } finally {
      setIsSaving(false);
    }
  }

  const field = (key: string, label: string, numeric: boolean) => (
    <div key={key}>
      <label htmlFor={`config-${key}`} className={labelClass}>
        {label}
      </label>
      <input
        id={`config-${key}`}
        value={draft[key]}
        inputMode={numeric ? "decimal" : undefined}
        onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))}
        className={inputClass}
      />
    </div>
  );

  return (
    <form onSubmit={save} className={`${cardClass} grid gap-4 sm:grid-cols-2`} noValidate>
      <div className="sm:col-span-2">
        <h2 className="text-lg font-bold">{s.rules}</h2>
        <p className="text-sm text-ink-muted">{s.rulesHint}</p>
      </div>
      <label className="flex items-center gap-2 text-base sm:col-span-2">
        <input
          type="checkbox"
          checked={draft.codEnabled === "true"}
          onChange={(e) => setDraft((d) => ({ ...d, codEnabled: String(e.target.checked) }))}
          className="size-5 accent-brand-600"
        />
        {s.codEnabled}
      </label>
      {MONEY_FIELDS.map(({ key, label }) => field(key, label, true))}
      {NUMBER_FIELDS.map(({ key, label }) => field(key, label, true))}
      {TEXT_FIELDS.map(({ key, label }) => field(key, label, false))}
      <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
        <button type="submit" disabled={isSaving} className={primaryButtonClass}>
          {s.save}
        </button>
        {message && (
          <p className={message.tone === "error" ? errorClass : "text-base font-semibold text-brand-700"} role="status">
            {message.text}
          </p>
        )}
      </div>
    </form>
  );
}
