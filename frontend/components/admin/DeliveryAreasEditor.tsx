"use client";

import { deliveryAreaInputSchema, formatPaise, paiseToRupees, pincodeParamSchema, rupeesToPaise, type DeliveryArea } from "@agri/shared";
import { Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { cardClass, errorClass, inputClass, labelClass, primaryButtonClass } from "@/components/ui/styles";
import { adminApi } from "@/lib/api/admin.client";
import { describeError } from "@/lib/api/browser";
import { t } from "@/lib/i18n";

const s = t.admin.settings;
const blankDraft = { pincode: "", district: "", fee: "0", etaDays: "3", codAvailable: true, isActive: true };

/** Pincodes the store delivers to. Saving an existing pincode updates it. */
export default function DeliveryAreasEditor({ areas }: { areas: DeliveryArea[] }) {
  const router = useRouter();
  const [draft, setDraft] = useState(blankDraft);
  const [busyPincode, setBusyPincode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(pincode: string, action: () => Promise<unknown>) {
    setBusyPincode(pincode);
    setError(null);
    try {
      await action();
      router.refresh();
      return true;
    } catch (err) {
      setError(describeError(err, t.state.networkError));
      return false;
    } finally {
      setBusyPincode(null);
    }
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    const pincode = pincodeParamSchema.safeParse({ pincode: draft.pincode.trim() });
    const area = deliveryAreaInputSchema.safeParse({
      district: draft.district,
      deliveryFeePaise: rupeesToPaise(Number(draft.fee)),
      etaDays: Number(draft.etaDays),
      codAvailable: draft.codAvailable,
      isActive: draft.isActive,
    });
    if (!pincode.success || !area.success) {
      setError((pincode.error ?? area.error)!.issues[0]!.message);
      return;
    }
    if (await run(pincode.data.pincode, () => adminApi.saveDeliveryArea(pincode.data.pincode, area.data))) {
      setDraft(blankDraft);
    }
  }

  const edit = (area: DeliveryArea) =>
    setDraft({
      pincode: area.pincode,
      district: area.district,
      fee: String(paiseToRupees(area.deliveryFeePaise)),
      etaDays: String(area.etaDays),
      codAvailable: area.codAvailable,
      isActive: area.isActive,
    });

  const textInput = (key: "pincode" | "district" | "fee" | "etaDays", label: string) => (
    <div>
      <label htmlFor={`area-${key}`} className={labelClass}>
        {label}
      </label>
      <input
        id={`area-${key}`}
        value={draft[key]}
        inputMode={key === "district" ? undefined : "numeric"}
        onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))}
        className={inputClass}
      />
    </div>
  );

  return (
    <section className={`${cardClass} flex flex-col gap-4`}>
      <div>
        <h2 className="text-lg font-bold">{s.areas}</h2>
        <p className="text-sm text-ink-muted">{s.areasHint}</p>
      </div>

      <form onSubmit={save} className="grid items-end gap-3 rounded-xl bg-brand-50 p-4 sm:grid-cols-3 lg:grid-cols-7" noValidate>
        {textInput("pincode", s.pincode)}
        {textInput("district", s.district)}
        {textInput("fee", s.fee)}
        {textInput("etaDays", s.eta)}
        {(["codAvailable", "isActive"] as const).map((key) => (
          <label key={key} className="flex h-12 items-center gap-2 text-base">
            <input
              type="checkbox"
              checked={draft[key]}
              onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.checked }))}
              className="size-5 accent-brand-600"
            />
            {key === "codAvailable" ? s.cod : s.active}
          </label>
        ))}
        <button type="submit" disabled={busyPincode !== null} className={primaryButtonClass}>
          {s.addArea}
        </button>
      </form>

      {error && <p className={errorClass}>{error}</p>}

      {areas.length === 0 ? (
        <p className="text-base text-ink-muted">{s.noAreas}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead className="border-b border-line text-ink-muted">
              <tr>
                {[s.pincode, s.district, s.fee, s.eta, s.cod, s.active, ""].map((h) => (
                  <th key={h} scope="col" className="px-3 py-2 font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {areas.map((area) => (
                <tr key={area.pincode} className={area.isActive ? "" : "text-ink-muted"}>
                  <td className="px-3 py-2 font-semibold tabular-nums">{area.pincode}</td>
                  <td className="px-3 py-2">{area.district}</td>
                  <td className="px-3 py-2 tabular-nums">{area.deliveryFeePaise === 0 ? t.checkout.free : formatPaise(area.deliveryFeePaise)}</td>
                  <td className="px-3 py-2 tabular-nums">{area.etaDays}</td>
                  <td className="px-3 py-2">{area.codAvailable ? t.state.yes : t.state.no}</td>
                  <td className="px-3 py-2">{area.isActive ? t.state.yes : t.state.no}</td>
                  <td className="px-3 py-2">
                    <span className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => edit(area)}
                        aria-label={`${t.admin.products.edit} ${area.pincode}`}
                        className="flex size-9 items-center justify-center rounded-lg hover:bg-brand-50"
                      >
                        <Pencil className="size-4" aria-hidden />
                      </button>
                      <button
                        type="button"
                        onClick={() => void run(area.pincode, () => adminApi.deleteDeliveryArea(area.pincode))}
                        disabled={busyPincode === area.pincode}
                        aria-label={`${s.remove} ${area.pincode}`}
                        className="flex size-9 items-center justify-center rounded-lg text-red-700 hover:bg-red-50 disabled:opacity-40"
                      >
                        <Trash2 className="size-4" aria-hidden />
                      </button>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
