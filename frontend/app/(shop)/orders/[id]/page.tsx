import type { Order } from "@agri/shared";
import { PartyPopper } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, unstable_rethrow } from "next/navigation";
import { Suspense } from "react";
import CancelOrderButton from "@/components/orders/CancelOrderButton";
import OrderDetailView from "@/components/orders/OrderDetailView";
import { ApiRequestError } from "@/lib/api/http";
import { serverGet } from "@/lib/api/server";
import { getStoreConfig } from "@/lib/api/store.client";
import { firstParam } from "@/lib/format";
import { t } from "@/lib/i18n";

export const metadata: Metadata = { title: "Order details" };

/** The API only returns the signed-in customer's own orders; anything else is a 404. */
async function loadMyOrder(id: string) {
  try {
    return await serverGet<Order>(`/orders/${id}`);
  } catch (err) {
    unstable_rethrow(err);
    if (err instanceof ApiRequestError && (err.status === 404 || err.status === 400)) notFound();
    throw err;
  }
}

async function OrderView({ params, searchParams }: PageProps<"/orders/[id]">) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const [order, store] = await Promise.all([loadMyOrder(id), getStoreConfig()]);
  const justPlaced = firstParam(query.placed) === "1";

  return (
    <>
      {justPlaced && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl bg-brand-600 p-5 text-white">
          <PartyPopper className="size-8 shrink-0" aria-hidden />
          <div>
            <p className="text-xl font-bold">{t.orders.placedTitle}</p>
            <p className="text-base text-brand-50">{t.orders.placedHint(order.orderNumber)}</p>
          </div>
        </div>
      )}
      <OrderDetailView
        order={order}
        timeZone={store.timezone}
        actions={order.canCancel ? <CancelOrderButton orderId={order.id} /> : undefined}
      />
      <Link href="/orders" className="mt-6 inline-block text-base font-semibold text-brand-700 hover:underline">
        ← {t.orders.viewAll}
      </Link>
    </>
  );
}

export default function OrderPage(props: PageProps<"/orders/[id]">) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-white" aria-busy="true" />}>
        <OrderView {...props} />
      </Suspense>
    </div>
  );
}
