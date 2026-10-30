"use client";

import type {
  NewAddress,
  CheckoutQuote,
  CheckoutQuoteInput,
  Customer,
  DeliveryCheck,
  Order,
  PlaceOrderInput,
} from "@agri/shared";
import { apiCall } from "./browser";

/** Browser-side calls used by the cart, checkout and order pages. */
export const checkoutApi = {
  quote: (input: CheckoutQuoteInput) => apiCall<CheckoutQuote>("/orders/quote", { method: "POST", body: input }),

  placeOrder: (input: PlaceOrderInput) => apiCall<Order>("/orders", { method: "POST", body: input }),

  cancelOrder: (orderId: string) => apiCall<Order>(`/orders/${orderId}/cancel`, { method: "POST" }),

  addAddress: (address: NewAddress) =>
    apiCall<Customer>("/customers/me/addresses", { method: "POST", body: address }),

  checkDelivery: (pincode: string) => apiCall<DeliveryCheck>(`/store/delivery/${pincode}`),
};
