import { ORDER_STATUSES, orderListQuerySchema, type OrderListQuery, type OrderSummary, type Paginated } from "@agri/shared";
import { Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import OrdersTable from "@/components/admin/OrdersTable";
import Pagination from "@/components/catalog/Pagination";
import { cardClass, inputClass } from "@/components/ui/styles";
import { toQueryString } from "@/lib/api/http";
import { serverGet } from "@/lib/api/server";
import { getStoreConfig } from "@/lib/api/store.client";
import { firstParam } from "@/lib/format";
import { t } from "@/lib/i18n";

export const metadata: Metadata = { title: "Admin orders" };

export default async function AdminOrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  const raw = await searchParams;
  const parsed = orderListQuerySchema.safeParse({
    status: firstParam(raw.status),
    q: firstParam(raw.q),
    page: firstParam(raw.page),
  });
  const query: OrderListQuery = parsed.success ? parsed.data : orderListQuerySchema.parse({});

  const [orders, store] = await Promise.all([
    serverGet<Paginated<OrderSummary>>(`/admin/orders${toQueryString(query)}`),
    getStoreConfig(),
  ]);

  const hrefWith = (changes: Partial<OrderListQuery>) =>
    `/admin/orders${toQueryString({ ...query, page: undefined, ...changes })}`;
  const tab = (isActive: boolean) =>
    `shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${
      isActive ? "bg-brand-600 text-white" : "bg-white text-ink ring-1 ring-line hover:ring-brand-600"
    }`;

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-bold">{t.admin.nav.orders}</h1>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <nav className="flex gap-2 overflow-x-auto pb-1" aria-label="Filter by status">
          <Link href={hrefWith({ status: undefined })} className={tab(!query.status)}>
            {t.admin.orders.all}
          </Link>
          {ORDER_STATUSES.map((status) => (
            <Link key={status} href={hrefWith({ status })} className={tab(query.status === status)}>
              {t.orders.status[status]}
            </Link>
          ))}
        </nav>
        <form action="/admin/orders" className="flex w-full gap-2 lg:w-80">
          {query.status && <input type="hidden" name="status" value={query.status} />}
          <input name="q" defaultValue={query.q} placeholder={t.admin.orders.search} className={inputClass} />
          <button type="submit" aria-label={t.nav.search} className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white">
            <Search className="size-5" aria-hidden />
          </button>
        </form>
      </div>

      <section className={`${cardClass} p-0`}>
        <OrdersTable orders={orders.items} timeZone={store.timezone} />
      </section>

      <Pagination page={orders.page} totalPages={orders.totalPages} hrefFor={(page) => hrefWith({ page })} />
    </div>
  );
}
