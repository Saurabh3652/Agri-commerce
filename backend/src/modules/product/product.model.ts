import { Schema, model, type InferSchemaType, type Types } from "mongoose";

/** One pack size, stored inside the product document (products and their sizes are always read together). */
const variantSchema = new Schema({
  sku: { type: String, required: true, trim: true },
  label: { type: String, required: true }, // "45 kg bag"
  unit: { type: String, required: true }, // "kg", "L", "piece"
  pricePaise: { type: Number, required: true, min: 0 },
  mrpPaise: { type: Number, required: true, min: 0 },
  retailerPricePaise: { type: Number, min: 0, default: null },
  minOrderQty: { type: Number, min: 1, default: 1 },
  stock: { type: Number, min: 0, default: 0 },
  isActive: { type: Boolean, default: true },
});

const productSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    brand: { type: String, default: null },
    categoryId: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    images: { type: [String], default: [] },
    icon: { type: String, default: null }, // emoji fallback when there is no image
    crops: { type: [String], default: [] }, // e.g. ["cotton", "groundnut"]
    usageInstructions: { type: String, default: null },
    variants: {
      type: [variantSchema],
      validate: { validator: (v: unknown[]) => v.length > 0, message: "A product needs at least one variant" },
    },
    /** Cheapest active variant price. Kept in sync by the pre-save hook below; used for sorting by price. */
    minPricePaise: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    seo: {
      title: { type: String, default: null },
      description: { type: String, default: null },
    },
    /** Other languages, keyed by locale: { gu: { name, description } } */
    translations: {
      type: Map,
      of: new Schema(
        { name: String, description: String, usageInstructions: String },
        { _id: false },
      ),
      default: {},
    },
  },
  { timestamps: true, collection: "products" },
);

productSchema.index({ isActive: 1, categoryId: 1 });
productSchema.index({ isActive: 1, isFeatured: 1 });
productSchema.index({ isActive: 1, minPricePaise: 1 });
productSchema.index({ isActive: 1, createdAt: -1 });
productSchema.index({ crops: 1 });
productSchema.index({ "variants.sku": 1 }, { unique: true });

productSchema.pre("save", function () {
  const prices = this.variants.filter((v) => v.isActive).map((v) => v.pricePaise);
  this.minPricePaise = prices.length > 0 ? Math.min(...prices) : 0;
});

export type ProductRecord = InferSchemaType<typeof productSchema> & { _id: Types.ObjectId };
export type VariantRecord = ProductRecord["variants"][number] & { _id: Types.ObjectId };
export const ProductModel = model("Product", productSchema);
