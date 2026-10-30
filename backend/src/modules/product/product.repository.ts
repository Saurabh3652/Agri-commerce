// Repository = the only place that talks to MongoDB for products.
// Services describe *what* they want (ProductFilter); this file decides *how* to query for it.
import type { ProductSort } from "@agri/shared";
import type { ClientSession, QueryFilter, SortOrder, Types } from "mongoose";
import type { CategoryRecord } from "../category/category.model";
import { ProductModel, type ProductRecord } from "./product.model";

export type ProductFilter = {
  categoryId?: Types.ObjectId;
  crop?: string;
  featured?: boolean;
  search?: string;
};

export type Pagination = { sort: ProductSort; skip: number; limit: number };

/** Product with its category joined in (via populate). */
export type ProductWithCategory = Omit<ProductRecord, "categoryId"> & {
  categoryId: Pick<CategoryRecord, "_id" | "slug" | "name">;
};

const SORTS: Record<ProductSort, Record<string, SortOrder>> = {
  newest: { createdAt: -1 },
  price_asc: { minPricePaise: 1, name: 1 },
  price_desc: { minPricePaise: -1, name: 1 },
  name: { name: 1 },
};

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function buildQuery(filter: ProductFilter): QueryFilter<ProductRecord> {
  const query: QueryFilter<ProductRecord> = { isActive: true };
  if (filter.categoryId) query.categoryId = filter.categoryId;
  if (filter.crop) query.crops = filter.crop;
  if (filter.featured !== undefined) query.isFeatured = filter.featured;
  if (filter.search) {
    // Simple "contains" search for the MVP. Switch to Atlas Search when the catalogue grows.
    const pattern = new RegExp(escapeRegex(filter.search), "i");
    query.$or = [{ name: pattern }, { brand: pattern }, { crops: pattern }];
  }
  return query;
}

export const productRepository = {
  findMany(filter: ProductFilter, { sort, skip, limit }: Pagination) {
    return ProductModel.find(buildQuery(filter))
      .sort(SORTS[sort])
      .skip(skip)
      .limit(limit)
      .populate("categoryId", "slug name")
      .lean<ProductWithCategory[]>();
  },

  count(filter: ProductFilter) {
    return ProductModel.countDocuments(buildQuery(filter));
  },

  findActiveBySlug(slug: string) {
    return ProductModel.findOne({ slug, isActive: true })
      .populate("categoryId", "slug name")
      .lean<ProductWithCategory>();
  },

  // ---------- Stock (used inside the order transaction) ----------

  findByVariantIds(variantIds: string[], session?: ClientSession) {
    return ProductModel.find({ "variants._id": { $in: variantIds } })
      .session(session ?? null)
      .lean<ProductRecord[]>();
  },

  /**
   * Takes stock only if enough is left, in one atomic step, so two farmers can never both
   * buy the last bag. Returns false when there wasn't enough.
   */
  async takeStock(variantId: string, quantity: number, session: ClientSession) {
    const result = await ProductModel.updateOne(
      { variants: { $elemMatch: { _id: variantId, isActive: true, stock: { $gte: quantity } } } },
      { $inc: { "variants.$.stock": -quantity } },
      { session },
    );
    return result.modifiedCount === 1;
  },

  returnStock(variantId: string, quantity: number, session: ClientSession) {
    return ProductModel.updateOne(
      { "variants._id": variantId },
      { $inc: { "variants.$.stock": quantity } },
      { session },
    );
  },

  // ---------- Admin ----------

  listForAdmin(search: string | undefined, skip: number, limit: number) {
    const query = search ? { name: new RegExp(escapeRegex(search), "i") } : {};
    return Promise.all([
      ProductModel.find(query)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("categoryId", "slug name")
        .lean<ProductWithCategory[]>(),
      ProductModel.countDocuments(query),
    ]);
  },

  findByIdForAdmin(id: string) {
    return ProductModel.findById(id).populate("categoryId", "slug name").lean<ProductWithCategory>();
  },

  /** Uses save() so the minPricePaise hook and schema validation always run. */
  async save(id: string | null, data: Record<string, unknown>) {
    const doc = id ? await ProductModel.findById(id) : new ProductModel();
    if (!doc) return null;
    doc.set(data);
    await doc.save();
    return doc._id.toString();
  },
};
