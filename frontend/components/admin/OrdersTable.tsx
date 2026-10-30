import { formatPaise, type OrderSummary } from "@agri/shared";
import Link from "next/link";
import OrderStatusBadge from "@/components/orders/OrderStatusBadge";
import { formatDateTime } from "@/lib/format";
import { t } from "@/lib/i18n";

/** Order list used by the dashboard and the orders page. Each row opens the order. */
export default function OrdersTable({ orders, timeZone }: { orders: OrderSummary[]; timeZone: string }) {
  if (orders.length === 0) return <p className="p-5 text-base text-ink-muted">{t.admin.orders.empty}</p>;
  const col = t.admin.orders.columns;

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[44rem] text-left text-sm">
        <thead className="border-b border-line text-ink-muted">
          <tr>
            {[col.order, col.customer, col.district, col.items, col.total, col.status, col.date].map((heading) => (
              <th key={heading} scope="col" className="px-4 py-3 font-semibold">
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {orders.map((order) => (
            <tr key={order.id} className="hover:bg-brand-50">
              <td className="px-4 py-3">
                <Link href={`/admin/orders/${order.id}`} className="font-semibold text-brand-700 hover:underline">
                  {order.orderNumber}
                </Link>
              </td>
              <td className="px-4 py-3">
                {order.customer.name}
                <span className="block text-ink-muted">{order.customer.phone}</span>
              </td>
              <td className="px-4 py-3">{order.district}</td>
              <td className="px-4 py-3 tabular-nums">{order.itemCount}</td>
              <td className="px-4 py-3 font-semibold tabular-nums">{formatPaise(order.totalPaise)}</td>
              <td className="px-4 py-3">
                <OrderStatusBadge status={order.status} />
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-ink-muted">{formatDateTime(order.createdAt, timeZone)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
