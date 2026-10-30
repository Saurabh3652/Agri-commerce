import { formatPaise, type AdminDashboard } from "@agri/shared";
import { AlertTriangle, IndianRupee, ShoppingBag, Timer, Users, type LucideIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import OrdersTable from "@/components/admin/OrdersTable";
import OrderStatusBadge from "@/components/orders/OrderStatusBadge";
import { cardClass } from "@/components/ui/styles";
import { serverGet } from "@/lib/api/server";
import { getStoreConfig } from "@/lib/api/store.client";
import { t } from "@/lib/i18n";

export const metadata: Metadata = { title: "Admin dashboard" };

function StatCard({ icon: Icon, label, value, hint, href }: { icon: LucideIcon; label: string; value: string; hint?: string; href?: string }) {
  const body = (
    <>
      <span className="flex size-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
        <Icon className="size-6" aria-hidden />
      </span>
      <span className="mt-3 block text-sm text-ink-muted">{label}</span>
      <span className="block text-2xl font-bold tabular-nums">{value}</span>
      {hint && <span className="text-sm text-ink-muted">{hint}</span>}
    </>
  );
  return href ? (
    <Link href={href} className={`${cardClass} block hover:border-brand-600`}>
      {body}
    </Link>
  ) : (
    <div className={cardClass}>{body}</div>
  );
}

/** Bars scaled to the best day. Days are labelled by date so the scale is honest. */
function SalesChart({ days }: { days: AdminDashboard["dailySales"] }) {
  const max = Math.max(...days.map((d) => d.revenuePaise), 1);
  return (
    <div className="flex h-48 items-end gap-1.5" role="img" aria-label={t.admin.dashboard.salesChart}>
      {days.map((day) => (
        <div key={day.date} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
          <div
            className="w-full rounded-t-md bg-brand-600"
            style={{ height: `${Math.max((day.revenuePaise / max) * 100, day.revenuePaise > 0 ? 3 : 0)}%` }}
            title={`${day.date}: ${formatPaise(day.revenuePaise)} · ${day.orders} orders`}
          />
          <span className="text-[10px] text-ink-muted tabular-nums">{day.date.slice(8)}</span>
        </div>
      ))}
    </div>
  );
}

export default async function AdminDashboardPage() {
  const [data, store] = await Promise.all([serverGet<AdminDashboard>("/admin/dashboard"), getStoreConfig()]);
  const d = t.admin.dashboard;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">{t.admin.nav.dashboard}</h1>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={ShoppingBag} label={d.todayOrders} value={String(data.todayOrders)} />
        <StatCard
          icon={IndianRupee}
          label={d.revenue30}
          value={formatPaise(data.revenue30DaysPaise)}
          hint={d.orders30(data.orders30Days)}
        />
        <StatCard icon={Timer} label={d.openOrders} value={String(data.openOrders)} href="/admin/orders?status=PLACED" />
        <StatCard icon={Users} label={d.customers} value={String(data.customers)} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <section className={cardClass}>
          <h2 className="mb-4 text-lg font-bold">{d.salesChart}</h2>
          <SalesChart days={data.dailySales} />
        </section>
        <section className={cardClass}>
          <h2 className="mb-4 text-lg font-bold">{d.byStatus}</h2>
          <ul className="flex flex-col gap-2">
            {data.ordersByStatus.map(({ status, count }) => (
              <li key={status}>
                <Link
                  href={`/admin/orders?status=${status}`}
                  className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-brand-50"
                >
                  <OrderStatusBadge status={status} />
                  <span className="text-lg font-bold tabular-nums">{count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className={cardClass}>
          <h2 className="mb-3 text-lg font-bold">{d.topProducts}</h2>
          <ol className="divide-y divide-line">
            {data.topProducts.map((p, index) => (
              <li key={p.productName} className="flex items-center justify-between gap-3 py-2.5 text-base">
                <span className="min-w-0">
                  <span className="mr-2 text-ink-muted">{index + 1}.</span>
                  {p.productName}
                  <span className="ml-2 text-sm text-ink-muted">{d.sold(p.quantity)}</span>
                </span>
                <span className="font-semibold tabular-nums">{formatPaise(p.revenuePaise)}</span>
              </li>
            ))}
          </ol>
        </section>
        <section className={cardClass}>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-bold">
            <AlertTriangle className="size-5 text-warn" aria-hidden />
            {d.lowStock}
          </h2>
          {data.lowStock.length === 0 ? (
            <p className="text-base text-ink-muted">{d.noLowStock}</p>
          ) : (
            <ul className="divide-y divide-line">
              {data.lowStock.map((item) => (
                <li key={`${item.productId}-${item.variantLabel}`} className="flex justify-between gap-3 py-2.5 text-base">
                  <Link href={`/admin/products/${item.productId}`} className="min-w-0 hover:underline">
                    {item.productName} <span className="text-ink-muted">· {item.variantLabel}</span>
                  </Link>
                  <span className={`font-semibold tabular-nums ${item.stock === 0 ? "text-red-700" : "text-warn"}`}>
                    {d.left(item.stock)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className={`${cardClass} p-0`}>
        <h2 className="px-5 pt-5 text-lg font-bold">{d.recentOrders}</h2>
        <OrdersTable orders={data.recentOrders} timeZone={store.timezone} />
      </section>
    </div>
  );
}
