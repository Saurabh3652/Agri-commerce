import { z } from "zod";
import { ORDER_STATUSES, PAYMENT_METHODS } from "../constants";

const objectId = z.string().regex(/^[a-f0-9]{24}$/, "Invalid id");

/**
 * The cart as the browser sends it: only ids and quantities.
 * Prices are never accepted from the client; the server always recalculates them.
 */
export const cartLinesSchema = z
  .array(z.object({ variantId: objectId, quantity: z.number().int().min(1).max(999) }))
  .min(1, "Your cart is empty")
  .max(50);

export const checkoutQuoteSchema = z.object({
  items: cartLinesSchema,
  addressId: objectId.optional(),
});
export type CheckoutQuoteInput = z.infer<typeof checkoutQuoteSchema>;

export const placeOrderSchema = z.object({
  items: cartLinesSchema,
  addressId: objectId,
  paymentMethod: z.enum(PAYMENT_METHODS),
  /** Created once per checkout visit, so a double tap or retry can never create two orders. */
  idempotencyKey: z.uuid(),
  note: z.string().trim().max(300).optional(),
});
export type PlaceOrderInput = z.infer<typeof placeOrderSchema>;

export const orderListQuerySchema = z.object({
  status: z.enum(ORDER_STATUSES).optional(),
  q: z.string().trim().max(40).optional(), // order number or phone (admin)
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type OrderListQuery = z.infer<typeof orderListQuerySchema>;

export const updateOrderStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
  note: z.string().trim().max(300).optional(),
});
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;

export const idParamSchema = z.object({ id: objectId });
