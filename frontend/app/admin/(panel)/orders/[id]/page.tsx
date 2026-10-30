import type { Order } from "@agri/shared";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, unstable_rethrow } from "next/navigation";
import OrderStatusActions from "@/components/admin/OrderStatusActions";
import OrderDetailView from "@/components/orders/OrderDetailView";
import { ApiRequestError } from "@/lib/api/http";
import { serverGet } from "@/lib/api/server";
import { getStoreConfig } from "@/lib/api/store.client";
import { t } from "@/lib/i18n";

export const metadata: Metadata = { title: "Admin order" };

async function loadOrder(id: string) {
  try {
    return await serverGet<Order>(`/admin/orders/${id}`);
  } catch (err) {
    unstable_rethrow(err);
    if (err instanceof ApiRequestError && (err.status === 404 || err.status === 400)) notFound();
    throw err;
  }
}

export default async function AdminOrderPage({ params }: PageProps<"/admin/orders/[id]">) {
  const { id } = await params;
  const [order, store] = await Promise.all([loadOrder(id), getStoreConfig()]);

  return (
    <div className="flex flex-col gap-4">
      <Link href="/admin/orders" className="text-base font-semibold text-brand-700 hover:underline">
        ← {t.admin.nav.orders}
      </Link>
      <OrderDetailView
        order={order}
        timeZone={store.timezone}
        showCustomer
        actions={<OrderStatusActions orderId={order.id} status={order.status} />}
      />
    </div>
  );
}
