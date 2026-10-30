import { formatPaise, type OrderSummary, type Paginated } from "@agri/shared";
import { ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import Pagination from "@/components/catalog/Pagination";
import OrderStatusBadge from "@/components/orders/OrderStatusBadge";
import { cardClass, primaryButtonClass } from "@/components/ui/styles";
import { serverGet } from "@/lib/api/server";
import { getStoreConfig } from "@/lib/api/store.client";
import { firstParam, formatDate } from "@/lib/format";
import { t } from "@/lib/i18n";

export const metadata: Metadata = { title: "My orders" };

async function OrderList({ searchParams }: { searchParams: PageProps<"/orders">["searchParams"] }) {
  const page = Math.max(1, Number(firstParam((await searchParams).page)) || 1);
  const [orders, store] = await Promise.all([
    serverGet<Paginated<OrderSummary>>(`/orders?page=${page}`),
    getStoreConfig(),
  ]);

  if (orders.total === 0) {
    return (
      <div className={`${cardClass} text-center`}>
        <p className="text-lg">{t.orders.empty}</p>
        <Link href="/products" className={`${primaryButtonClass} mx-auto mt-4 w-fit`}>
          {t.cart.startShopping}
        </Link>
      </div>
    );
  }

  return (
    <>
      <ul className="flex flex-col gap-3">
        {orders.items.map((order) => (
          <li key={order.id}>
            <Link
              href={`/orders/${order.id}`}
              className={`${cardClass} flex items-center justify-between gap-4 hover:border-brand-600`}
            >
              <div className="min-w-0">
                <p className="font-bold">{order.orderNumber}</p>
                <p className="text-sm text-ink-muted">
                  {formatDate(order.createdAt, store.timezone)} · {t.cart.items(order.itemCount)}
                </p>
                <p className="mt-1 text-lg font-bold">{formatPaise(order.totalPaise)}</p>
              </div>
              <div className="flex items-center gap-2">
                <OrderStatusBadge status={order.status} />
                <ChevronRight className="size-5 text-ink-muted" aria-hidden />
              </div>
            </Link>
          </li>
        ))}
      </ul>
      <Pagination page={orders.page} totalPages={orders.totalPages} hrefFor={(p) => `/orders?page=${p}`} />
    </>
  );
}

export default function OrdersPage({ searchParams }: PageProps<"/orders">) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="mb-5 text-2xl font-bold">{t.orders.title}</h1>
      <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-white" aria-busy="true" />}>
        <OrderList searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
