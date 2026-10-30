import { Schema, model, type InferSchemaType } from "mongoose";

/**
 * Store-wide rules, as a single document. These defaults are the only place starting values
 * live; after that an admin changes them from the panel. Money is in paise; 0 = no limit.
 */
const storeConfigSchema = new Schema(
  {
    _id: { type: String, default: "default" },
    codEnabled: { type: Boolean, default: true },
    codMaxOrderPaise: { type: Number, default: 50_000_00 }, // ₹50,000
    minOrderPaise: { type: Number, default: 0 },
    freeDeliveryAbovePaise: { type: Number, default: 2_000_00 }, // ₹2,000
    maxQuantityPerItem: { type: Number, default: 50 },
    lowStockThreshold: { type: Number, default: 10 },
    orderNumberPrefix: { type: String, default: "AGR-" },
    timezone: { type: String, default: "Asia/Kolkata" },
  },
  { timestamps: true, collection: "store_config" },
);

/** A pincode the store delivers to. The pincode itself is the id: one row per pincode. */
const deliveryAreaSchema = new Schema(
  {
    _id: { type: String, required: true, match: /^[1-9]\d{5}$/ },
    district: { type: String, required: true },
    deliveryFeePaise: { type: Number, required: true, min: 0 },
    etaDays: { type: Number, required: true, min: 0 },
    codAvailable: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, collection: "delivery_areas" },
);

deliveryAreaSchema.index({ district: 1 });

export type StoreConfigRecord = InferSchemaType<typeof storeConfigSchema>;
export type DeliveryAreaRecord = InferSchemaType<typeof deliveryAreaSchema>;
export const StoreConfigModel = model("StoreConfig", storeConfigSchema);
export const DeliveryAreaModel = model("DeliveryArea", deliveryAreaSchema);
