import { z } from "zod";

const paise = z.number().int().min(0);

/** Store-wide rules an admin can change without a deploy. Money is in paise; 0 means "no limit". */
export const storeConfigSchema = z.object({
  codEnabled: z.boolean(),
  codMaxOrderPaise: paise,
  minOrderPaise: paise,
  freeDeliveryAbovePaise: paise,
  maxQuantityPerItem: z.number().int().min(1).max(999),
  lowStockThreshold: z.number().int().min(0).max(10_000),
  orderNumberPrefix: z.string().trim().min(1).max(8),
  timezone: z.string().trim().min(1), // used for "today" and daily sales in the dashboard
});
export type StoreConfig = z.infer<typeof storeConfigSchema>;

export const pincodeParamSchema = z.object({
  pincode: z.string().regex(/^[1-9]\d{5}$/, "Enter a valid 6-digit pincode"),
});

/** A pincode the store delivers to. */
export const deliveryAreaInputSchema = z.object({
  district: z.string().trim().min(2).max(80),
  deliveryFeePaise: paise,
  etaDays: z.number().int().min(0).max(60),
  codAvailable: z.boolean(),
  isActive: z.boolean(),
});
export type DeliveryAreaInput = z.infer<typeof deliveryAreaInputSchema>;
