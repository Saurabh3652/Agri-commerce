import type { OrderStatus, PaymentMethod, PaymentStatus } from "../constants";
import type { ISODateString, Paise } from "./common";
import type { Address } from "./user";

/** One cart line after the server has re-priced and re-checked it. */
export type QuoteLine = {
  variantId: string;
  productId: string;
  productSlug: string;
  productName: string;
  variantLabel: string;
  icon: string | null;
  unitPricePaise: Paise;
  quantity: number;
  lineTotalPaise: Paise;
  availableStock: number;
  /** Why this line can't be ordered as-is (out of stock, too many…), or null when fine. */
  problem: string | null;
};

export type CheckoutQuote = {
  lines: QuoteLine[];
  subtotalPaise: Paise;
  deliveryFeePaise: Paise;
  totalPaise: Paise;
  delivery: { serviceable: boolean; etaDays: number | null; codAvailable: boolean } | null;
  /** Order-level problems (below minimum, area not served…). Empty when the order can be placed. */
  problems: string[];
  canPlaceOrder: boolean;
};

export type OrderItem = {
  productId: string;
  variantId: string;
  productSlug: string;
  productName: string;
  variantLabel: string;
  sku: string;
  unitPricePaise: Paise;
  quantity: number;
  lineTotalPaise: Paise;
};

export type OrderStatusEvent = { status: OrderStatus; note: string | null; at: ISODateString };

export type Order = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  items: OrderItem[];
  subtotalPaise: Paise;
  deliveryFeePaise: Paise;
  totalPaise: Paise;
  shippingAddress: Omit<Address, "id" | "isDefault">;
  customer: { id: string; name: string; phone: string };
  note: string | null;
  history: OrderStatusEvent[];
  canCancel: boolean;
  createdAt: ISODateString;
};

/** Small shape for order lists. */
export type OrderSummary = Pick<
  Order,
  "id" | "orderNumber" | "status" | "paymentMethod" | "paymentStatus" | "totalPaise" | "customer" | "createdAt"
> & { itemCount: number; district: string };
