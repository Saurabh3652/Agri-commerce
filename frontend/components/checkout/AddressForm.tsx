"use client";

import type { Customer, DeliveryCheck } from "@agri/shared";
import { CheckCircle2, XCircle } from "lucide-react";
import { useState, type FormEvent } from "react";
import { cardClass, errorClass, inputClass, labelClass, primaryButtonClass, secondaryButtonClass } from "@/components/ui/styles";
import { describeError } from "@/lib/api/browser";
import { checkoutApi } from "@/lib/api/checkout.client";
import { t } from "@/lib/i18n";

type Props = {
  customer: Customer;
  onSaved: (customer: Customer) => void;
  onCancel?: () => void;
};

/** The form's fields are exactly the address labels in the messages file. */
type Field = keyof typeof t.checkout.address;
const OPTIONAL: Field[] = ["label", "village", "landmark", "taluka"];

/** New delivery address. Checks the pincode as soon as it is typed, so nobody fills a form for nothing. */
export default function AddressForm({ customer, onSaved, onCancel }: Props) {
  const [values, setValues] = useState<Record<Field, string>>({
    label: "",
    name: customer.fullName,
    phone: customer.phone,
    line1: "",
    village: "",
    landmark: "",
    taluka: "",
    district: "",
    pincode: "",
  });
  const [delivery, setDelivery] = useState<DeliveryCheck | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onPincodeChange(pincode: string) {
    const digits = pincode.replace(/\D/g, "").slice(0, 6);
    setValues((v) => ({ ...v, pincode: digits }));
    setDelivery(null);
    if (digits.length !== 6) return;
    const check = await checkoutApi.checkDelivery(digits).catch(() => null);
    setDelivery(check);
    // Fill the district for them when we know it.
    if (check?.district) setValues((v) => ({ ...v, district: v.district || check.district! }));
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      const optional = Object.fromEntries(OPTIONAL.map((f) => [f, values[f].trim() || undefined]));
      const updated = await checkoutApi.addAddress({ ...values, ...optional });
      onSaved(updated);
    } catch (err) {
      setError(describeError(err, t.state.networkError));
    } finally {
      setIsSaving(false);
    }
  }

  const input = (field: Field, extra: Partial<React.InputHTMLAttributes<HTMLInputElement>> = {}) => (
    <div className={field === "line1" ? "sm:col-span-2" : ""}>
      <label htmlFor={`address-${field}`} className={labelClass}>
        {t.checkout.address[field]}
      </label>
      <input
        id={`address-${field}`}
        value={values[field]}
        onChange={(e) => setValues((v) => ({ ...v, [field]: e.target.value }))}
        required={!OPTIONAL.includes(field)}
        className={inputClass}
        {...extra}
      />
    </div>
  );

  return (
    <form onSubmit={save} className={`${cardClass} grid gap-4 sm:grid-cols-2`}>
      <div>
        <label htmlFor="address-pincode" className={labelClass}>
          {t.checkout.address.pincode}
        </label>
        <input
          id="address-pincode"
          inputMode="numeric"
          autoComplete="postal-code"
          required
          value={values.pincode}
          onChange={(e) => void onPincodeChange(e.target.value)}
          className={inputClass}
        />
        {delivery && (
          <p
            className={`mt-1 flex items-center gap-1 text-sm font-semibold ${delivery.serviceable ? "text-brand-700" : "text-red-700"}`}
          >
            {delivery.serviceable ? <CheckCircle2 className="size-4" aria-hidden /> : <XCircle className="size-4" aria-hidden />}
            {delivery.serviceable
              ? t.checkout.pincodeServiceable(delivery.district ?? "", delivery.etaDays)
              : t.checkout.pincodeNotServiceable}
          </p>
        )}
      </div>
      {input("district", { autoComplete: "address-level2" })}
      {input("line1", { autoComplete: "address-line1" })}
      {input("village")}
      {input("taluka")}
      {input("landmark")}
      {input("name", { autoComplete: "name" })}
      {input("phone", { inputMode: "numeric", autoComplete: "tel", maxLength: 10 })}
      {input("label")}

      {error && <p className={`${errorClass} sm:col-span-2`}>{error}</p>}

      <div className="flex flex-wrap gap-3 sm:col-span-2">
        <button type="submit" disabled={isSaving} className={primaryButtonClass}>
          {isSaving ? t.checkout.saving : t.checkout.saveAddress}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className={secondaryButtonClass}>
            {t.checkout.cancel}
          </button>
        )}
      </div>
    </form>
  );
}
