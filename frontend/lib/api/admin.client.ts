"use client";

import type {
  AdminProduct,
  DeliveryArea,
  DeliveryAreaInput,
  Order,
  ProductInput,
  StoreConfig,
  UpdateOrderStatusInput,
} from "@agri/shared";
import { apiCall } from "./browser";

/** Admin changes, sent from the browser. The API checks the ADMIN role on every call. */
export const adminApi = {
  updateOrderStatus: (orderId: string, input: UpdateOrderStatusInput) =>
    apiCall<Order>(`/admin/orders/${orderId}/status`, { method: "PATCH", body: input }),

  saveProduct: (productId: string | null, input: ProductInput) =>
    productId
      ? apiCall<AdminProduct>(`/admin/products/${productId}`, { method: "PUT", body: input })
      : apiCall<AdminProduct>("/admin/products", { method: "POST", body: input }),

  saveStoreConfig: (config: StoreConfig) =>
    apiCall<StoreConfig>("/admin/store/config", { method: "PUT", body: config }),

  saveDeliveryArea: (pincode: string, area: DeliveryAreaInput) =>
    apiCall<DeliveryArea>(`/admin/store/delivery-areas/${pincode}`, { method: "PUT", body: area }),

  deleteDeliveryArea: (pincode: string) =>
    apiCall<{ deleted: boolean }>(`/admin/store/delivery-areas/${pincode}`, { method: "DELETE" }),
};
