import type { OrderStatus } from "@agri/shared";
import { t } from "@/lib/i18n";

// Colour tells the state at a glance; the word says it for everyone (and for screen readers).
const TONE: Record<OrderStatus, string> = {
  PLACED: "bg-amber-100 text-amber-900",
  CONFIRMED: "bg-sky-100 text-sky-900",
  PACKED: "bg-indigo-100 text-indigo-900",
  SHIPPED: "bg-violet-100 text-violet-900",
  DELIVERED: "bg-brand-100 text-brand-800",
  CANCELLED: "bg-gray-200 text-gray-700",
};

export default function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold whitespace-nowrap ${TONE[status]}`}>
      {t.orders.status[status]}
    </span>
  );
}
