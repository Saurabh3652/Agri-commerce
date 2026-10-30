import { ORDER_STATUSES, formatPaise, type Order, type OrderStatus } from "@agri/shared";
import { Check, MapPin, Package, Wallet } from "lucide-react";
import type { ReactNode } from "react";
import { cardClass } from "@/components/ui/styles";
import { formatDateTime } from "@/lib/format";
import { t } from "@/lib/i18n";
import OrderStatusBadge from "./OrderStatusBadge";

// The happy path shown as steps. CANCELLED is shown as a badge instead of a step.
const STEPS: OrderStatus[] = ORDER_STATUSES.filter((s) => s !== "CANCELLED");

/** Progress steps: done steps are ticked, with the time each one happened. */
function OrderProgress({ order, timeZone }: { order: Order; timeZone: string }) {
  const reachedAt = (status: OrderStatus) => order.history.find((h) => h.status === status)?.at;
  const currentIndex = STEPS.indexOf(order.status);

  return (
    <ol className="flex flex-col gap-4">
      {STEPS.map((step, index) => {
        const at = reachedAt(step);
        const isDone = order.status !== "CANCELLED" && index <= currentIndex;
        return (
          <li key={step} className="flex items-start gap-3">
            <span
              className={`flex size-8 shrink-0 items-center justify-center rounded-full ${
                isDone ? "bg-brand-600 text-white" : "bg-gray-200 text-gray-500"
              }`}
            >
              {isDone ? <Check className="size-5" aria-hidden /> : index + 1}
            </span>
            <span>
              <span className={`block font-semibold ${isDone ? "" : "text-ink-muted"}`}>{t.orders.status[step]}</span>
              {at && <span className="text-sm text-ink-muted">{formatDateTime(at, timeZone)}</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

type Props = { order: Order; timeZone: string; actions?: ReactNode; showCustomer?: boolean };

/** Everything about one order. Shared by the customer's order page and the admin panel. */
export default function OrderDetailView({ order, timeZone, actions, showCustomer = false }: Props) {
  const address = order.shippingAddress;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <div className="flex flex-col gap-6">
        <section className={cardClass}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold">{t.orders.orderNumber(order.orderNumber)}</h1>
              <p className="text-base text-ink-muted">{t.orders.placedOn(formatDateTime(order.createdAt, timeZone))}</p>
            </div>
            <OrderStatusBadge status={order.status} />
          </div>

          <h2 className="mt-6 flex items-center gap-2 text-lg font-bold">
            <Package className="size-5 text-brand-700" aria-hidden />
            {t.orders.items}
          </h2>
          <ul className="mt-3 divide-y divide-line">
            {order.items.map((item) => (
              <li key={item.variantId} className="flex justify-between gap-3 py-3 text-base">
                <span>
                  <span className="block font-medium">{item.productName}</span>
                  <span className="text-sm text-ink-muted">
                    {item.variantLabel} · {formatPaise(item.unitPricePaise)} · {t.orders.qty(item.quantity)}
                  </span>
                </span>
                <span className="font-semibold">{formatPaise(item.lineTotalPaise)}</span>
              </li>
            ))}
          </ul>

          <dl className="mt-3 flex flex-col gap-1 border-t border-line pt-3 text-base">
            <div className="flex justify-between">
              <dt>{t.cart.subtotal}</dt>
              <dd>{formatPaise(order.subtotalPaise)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>{t.checkout.delivery}</dt>
              <dd>{order.deliveryFeePaise === 0 ? t.checkout.free : formatPaise(order.deliveryFeePaise)}</dd>
            </div>
            <div className="flex justify-between text-xl font-bold">
              <dt>{t.checkout.total}</dt>
              <dd>{formatPaise(order.totalPaise)}</dd>
            </div>
          </dl>
        </section>

        <div className="grid gap-6 sm:grid-cols-2">
          <section className={cardClass}>
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <MapPin className="size-5 text-brand-700" aria-hidden />
              {t.orders.deliveryAddress}
            </h2>
            <p className="mt-2 font-semibold">
              {address.name} · {address.phone}
            </p>
            <p className="text-base text-ink-muted">
              {[address.line1, address.landmark, address.village, address.taluka, address.district, address.state, address.pincode]
                .filter(Boolean)
                .join(", ")}
            </p>
            {order.note && <p className="mt-2 rounded-lg bg-brand-50 p-2 text-sm">“{order.note}”</p>}
          </section>

          <section className={cardClass}>
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <Wallet className="size-5 text-brand-700" aria-hidden />
              {t.orders.payment}
            </h2>
            <p className="mt-2 text-base">{t.orders.paymentMethod[order.paymentMethod]}</p>
            <p className="text-base font-semibold">{t.orders.paymentStatus[order.paymentStatus]}</p>
            {showCustomer && (
              <p className="mt-3 border-t border-line pt-3 text-base">
                <span className="block text-sm text-ink-muted">{t.admin.orders.customer}</span>
                {order.customer.name} · +91 {order.customer.phone}
              </p>
            )}
          </section>
        </div>
      </div>

      <aside className="flex flex-col gap-6">
        <section className={cardClass}>
          <h2 className="mb-4 text-lg font-bold">{t.orders.progress}</h2>
          <OrderProgress order={order} timeZone={timeZone} />
        </section>
        {actions}
      </aside>
    </div>
  );
}
