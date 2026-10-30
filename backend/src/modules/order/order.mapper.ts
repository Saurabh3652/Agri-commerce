import {
  CUSTOMER_CANCELLABLE_STATUSES,
  type Order,
  type OrderStatus,
  type OrderSummary,
  type PaymentMethod,
  type PaymentStatus,
} from "@agri/shared";
import type { OrderRecord } from "./order.model";

export function toOrderSummary(o: OrderRecord): OrderSummary {
  return {
    id: o._id.toString(),
    orderNumber: o.orderNumber,
    status: o.status as OrderStatus,
    paymentMethod: o.paymentMethod as PaymentMethod,
    paymentStatus: o.paymentStatus as PaymentStatus,
    totalPaise: o.totalPaise,
    itemCount: o.items.reduce((sum, i) => sum + i.quantity, 0),
    district: o.shippingAddress.district,
    customer: { id: o.customerId.toString(), name: o.customer.name, phone: o.customer.phone },
    createdAt: o.createdAt.toISOString(),
  };
}

export function toOrder(o: OrderRecord): Order {
  const a = o.shippingAddress;
  return {
    ...toOrderSummary(o),
    items: o.items.map((i) => ({
      productId: i.productId.toString(),
      variantId: i.variantId.toString(),
      productSlug: i.productSlug,
      productName: i.productName,
      variantLabel: i.variantLabel,
      sku: i.sku,
      unitPricePaise: i.unitPricePaise,
      quantity: i.quantity,
      lineTotalPaise: i.lineTotalPaise,
    })),
    subtotalPaise: o.subtotalPaise,
    deliveryFeePaise: o.deliveryFeePaise,
    shippingAddress: {
      label: a.label ?? null,
      name: a.name,
      phone: a.phone,
      line1: a.line1,
      village: a.village ?? null,
      landmark: a.landmark ?? null,
      taluka: a.taluka ?? null,
      district: a.district,
      state: a.state,
      pincode: a.pincode,
    },
    note: o.note ?? null,
    history: o.history.map((h) => ({ status: h.status as OrderStatus, note: h.note ?? null, at: h.at.toISOString() })),
    canCancel: CUSTOMER_CANCELLABLE_STATUSES.includes(o.status as OrderStatus),
  };
}
