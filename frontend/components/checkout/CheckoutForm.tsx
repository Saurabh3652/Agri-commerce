"use client";

import { PAYMENT_METHODS, formatPaise, type CheckoutQuote, type Customer } from "@agri/shared";
import { Banknote, Loader2, MapPin, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { cardClass, errorClass, inputClass, labelClass, primaryButtonClass, secondaryButtonClass } from "@/components/ui/styles";
import { ApiRequestError, describeError } from "@/lib/api/browser";
import { checkoutApi } from "@/lib/api/checkout.client";
import { useCart } from "@/lib/cart/CartContext";
import { t } from "@/lib/i18n";
import AddressForm from "./AddressForm";

type QuoteResult = { requestKey: string; quote: CheckoutQuote | null; error: string | null };

export default function CheckoutForm({ customer: initialCustomer }: { customer: Customer }) {
  const router = useRouter();
  const { items, isLoaded, clearCart } = useCart();

  const [customer, setCustomer] = useState(initialCustomer);
  const [addressId, setAddressId] = useState<string | null>(
    () => (initialCustomer.addresses.find((a) => a.isDefault) ?? initialCustomer.addresses[0])?.id ?? null,
  );
  const [isAddingAddress, setIsAddingAddress] = useState(initialCustomer.addresses.length === 0);
  const [note, setNote] = useState("");
  const [quoteResult, setQuoteResult] = useState<QuoteResult | null>(null);
  const [placeError, setPlaceError] = useState<string | null>(null);
  const [isPlacing, setIsPlacing] = useState(false);
  // One key per checkout visit: retries and double taps can never create a second order.
  const [idempotencyKey] = useState(() => crypto.randomUUID());

  const cartLines = useMemo(() => items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })), [items]);
  // Identifies the cart + address a quote was made for, so an outdated quote is never shown as current.
  const requestKey = JSON.stringify([cartLines, addressId]);

  useEffect(() => {
    if (!isLoaded || cartLines.length === 0) return;
    let isCurrent = true;
    checkoutApi
      .quote({ items: cartLines, addressId: addressId ?? undefined })
      .then((quote) => isCurrent && setQuoteResult({ requestKey, quote, error: null }))
      .catch((err) => isCurrent && setQuoteResult({ requestKey, quote: null, error: describeError(err, t.state.networkError) }));
    return () => {
      isCurrent = false; // a newer request has started; ignore this one's answer
    };
  }, [isLoaded, cartLines, addressId, requestKey]);

  const isQuoting = quoteResult?.requestKey !== requestKey;
  const quote = quoteResult?.quote ?? null;
  const canPlaceOrder = !isQuoting && !isPlacing && Boolean(addressId) && Boolean(quote?.canPlaceOrder);

  async function placeOrder() {
    if (!addressId) return;
    setIsPlacing(true);
    setPlaceError(null);
    try {
      const order = await checkoutApi.placeOrder({
        items: cartLines,
        addressId,
        paymentMethod: "COD",
        idempotencyKey,
        note: note.trim() || undefined,
      });
      router.replace(`/orders/${order.id}?placed=1`);
      clearCart();
    } catch (err) {
      // Prices or stock changed since the preview: show the fresh quote with the problem lines marked.
      if (err instanceof ApiRequestError && err.code === "CART_CHANGED") {
        setQuoteResult({ requestKey, quote: err.details as CheckoutQuote, error: null });
      }
      setPlaceError(describeError(err, t.state.networkError));
      setIsPlacing(false);
    }
  }

  if (isLoaded && items.length === 0) {
    return (
      <div className={`${cardClass} text-center`}>
        <p className="text-lg">{t.cart.empty}</p>
        <Link href="/products" className={`${primaryButtonClass} mx-auto mt-4 w-fit`}>
          {t.cart.startShopping}
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_24rem]">
      <div className="flex flex-col gap-6">
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-bold">
            <MapPin className="size-5 text-brand-700" aria-hidden />
            {t.checkout.deliverTo}
          </h2>

          {customer.addresses.length > 0 && (
            <ul className="flex flex-col gap-2">
              {customer.addresses.map((address) => (
                <li key={address.id}>
                  <label
                    className={`flex cursor-pointer gap-3 rounded-xl border-2 bg-white p-4 ${
                      address.id === addressId ? "border-brand-600" : "border-line"
                    }`}
                  >
                    <input
                      type="radio"
                      name="address"
                      checked={address.id === addressId}
                      onChange={() => setAddressId(address.id)}
                      className="mt-1 size-5 accent-brand-600"
                    />
                    <span>
                      <span className="block font-semibold">
                        {address.label ?? address.name} · {address.phone}
                      </span>
                      <span className="block text-base text-ink-muted">
                        {[address.line1, address.village, address.taluka, address.district, address.pincode]
                          .filter(Boolean)
                          .join(", ")}
                      </span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-3">
            {isAddingAddress ? (
              <AddressForm
                customer={customer}
                onSaved={(updated) => {
                  setCustomer(updated);
                  setAddressId(updated.addresses.at(-1)?.id ?? null);
                  setIsAddingAddress(false);
                }}
                onCancel={customer.addresses.length > 0 ? () => setIsAddingAddress(false) : undefined}
              />
            ) : (
              <button type="button" onClick={() => setIsAddingAddress(true)} className={secondaryButtonClass}>
                <Plus className="size-5" aria-hidden />
                {t.checkout.addAddress}
              </button>
            )}
          </div>
        </section>

        <section>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-bold">
            <Banknote className="size-5 text-brand-700" aria-hidden />
            {t.checkout.payment}
          </h2>
          {PAYMENT_METHODS.map((method) => (
            <label key={method} className="flex gap-3 rounded-xl border-2 border-brand-600 bg-white p-4">
              <input type="radio" name="payment" checked readOnly className="mt-1 size-5 accent-brand-600" />
              <span>
                <span className="block font-semibold">{t.orders.paymentMethod[method]}</span>
                <span className="block text-base text-ink-muted">{t.checkout.codHint}</span>
              </span>
            </label>
          ))}
        </section>

        <section>
          <label htmlFor="order-note" className={labelClass}>
            {t.checkout.note}
          </label>
          <input
            id="order-note"
            value={note}
            maxLength={300}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t.checkout.notePlaceholder}
            className={inputClass}
          />
        </section>
      </div>

      <aside className={`${cardClass} h-fit lg:sticky lg:top-36`}>
        <h2 className="text-lg font-bold">{t.checkout.summary}</h2>

        {!quote ? (
          <p className="mt-4 flex items-center gap-2 text-base text-ink-muted">
            <Loader2 className="size-5 animate-spin" aria-hidden />
            {t.checkout.checking}
          </p>
        ) : (
          <div className={isQuoting ? "opacity-50" : ""} aria-busy={isQuoting}>
            <ul className="mt-4 flex flex-col gap-3 border-b border-line pb-4">
              {quote.lines.map((line) => (
                <li key={line.variantId} className="flex justify-between gap-3 text-base">
                  <span className="min-w-0">
                    <span className="block font-medium">{line.productName}</span>
                    <span className="text-sm text-ink-muted">
                      {line.variantLabel} × {line.quantity}
                    </span>
                    {line.problem && <span className="block text-sm font-semibold text-red-700">{line.problem}</span>}
                  </span>
                  <span className="shrink-0 font-semibold">{formatPaise(line.lineTotalPaise)}</span>
                </li>
              ))}
            </ul>

            <dl className="mt-4 flex flex-col gap-2 text-base">
              <div className="flex justify-between">
                <dt>{t.cart.subtotal}</dt>
                <dd>{formatPaise(quote.subtotalPaise)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>{t.checkout.delivery}</dt>
                <dd>
                  {!quote.delivery
                    ? "—"
                    : quote.deliveryFeePaise === 0
                      ? t.checkout.free
                      : formatPaise(quote.deliveryFeePaise)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-line pt-3 text-xl font-bold">
                <dt>{t.checkout.total}</dt>
                <dd>{formatPaise(quote.totalPaise)}</dd>
              </div>
            </dl>

            {quote.delivery?.serviceable && quote.delivery.etaDays !== null && (
              <p className="mt-2 text-base font-semibold text-brand-700">{t.checkout.eta(quote.delivery.etaDays)}</p>
            )}
            {!addressId && <p className="mt-3 text-base text-ink-muted">{t.checkout.chooseAddress}</p>}
          </div>
        )}

        {(quote?.problems ?? []).map((problem) => (
          <p key={problem} className={`${errorClass} mt-3 text-sm`}>
            {problem}
          </p>
        ))}
        {(placeError ?? quoteResult?.error) && (
          <p className={`${errorClass} mt-3 text-sm`}>{placeError ?? quoteResult?.error}</p>
        )}

        <button
          type="button"
          onClick={() => void placeOrder()}
          disabled={!canPlaceOrder}
          className={`${primaryButtonClass} mt-5 h-14 w-full text-lg`}
        >
          {isPlacing ? (
            <>
              <Loader2 className="size-5 animate-spin" aria-hidden />
              {t.checkout.placing}
            </>
          ) : (
            t.checkout.placeOrder(quote ? formatPaise(quote.totalPaise) : "")
          )}
        </button>
      </aside>
    </div>
  );
}
