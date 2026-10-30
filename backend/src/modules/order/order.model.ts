import { ORDER_STATUSES, PAYMENT_METHODS, PAYMENT_STATUSES } from "@agri/shared";
import { Schema, model, type InferSchemaType, type Types } from "mongoose";

// Everything a past order shows is copied in at checkout (names, prices, address), so later
// edits to products or addresses never change an order that was already placed.

const orderItemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    variantId: { type: Schema.Types.ObjectId, required: true },
    productSlug: { type: String, required: true },
    productName: { type: String, required: true },
    variantLabel: { type: String, required: true },
    sku: { type: String, required: true },
    unitPricePaise: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    lineTotalPaise: { type: Number, required: true },
  },
  { _id: false },
);

const addressSnapshotSchema = new Schema(
  {
    label: String,
    name: { type: String, required: true },
    phone: { type: String, required: true },
    line1: { type: String, required: true },
    village: String,
    landmark: String,
    taluka: String,
    district: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
  },
  { _id: false },
);

const customerSnapshotSchema = new Schema(
  { name: { type: String, required: true }, phone: { type: String, required: true } },
  { _id: false },
);

const statusEventSchema = new Schema(
  {
    status: { type: String, enum: ORDER_STATUSES, required: true },
    note: { type: String, default: null },
    at: { type: Date, default: Date.now },
    by: { type: Schema.Types.ObjectId, ref: "Customer", default: null },
  },
  { _id: false },
);

const orderSchema = new Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    customerId: { type: Schema.Types.ObjectId, ref: "Customer", required: true },
    customer: { type: customerSnapshotSchema, required: true },
    items: { type: [orderItemSchema], required: true },
    subtotalPaise: { type: Number, required: true },
    deliveryFeePaise: { type: Number, required: true },
    totalPaise: { type: Number, required: true },
    shippingAddress: { type: addressSnapshotSchema, required: true },
    paymentMethod: { type: String, enum: PAYMENT_METHODS, required: true },
    paymentStatus: { type: String, enum: PAYMENT_STATUSES, default: "PENDING" },
    status: { type: String, enum: ORDER_STATUSES, default: "PLACED" },
    history: { type: [statusEventSchema], default: [] },
    note: { type: String, default: null },
    idempotencyKey: { type: String, required: true },
  },
  { timestamps: true, collection: "orders" },
);

// Same key from the same customer = the same order (protects against double taps and retries).
orderSchema.index({ customerId: 1, idempotencyKey: 1 }, { unique: true });
orderSchema.index({ customerId: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ "customer.phone": 1 });

/** Hands out sequential, human-friendly order numbers (AGR-000042). */
const counterSchema = new Schema({ _id: String, seq: { type: Number, default: 0 } }, { collection: "counters" });

export type OrderRecord = InferSchemaType<typeof orderSchema> & { _id: Types.ObjectId };
export const OrderModel = model("Order", orderSchema);
export const CounterModel = model("Counter", counterSchema);
