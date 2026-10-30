import type {
  AdminProduct,
  AdminProductListQuery,
  Paginated,
  ProductDetail,
  ProductInput,
  ProductListItem,
  ProductListQuery,
} from "@agri/shared";
import { AppError } from "../../common/errors/app-error";
import { categoryRepository } from "../category/category.repository";
import { toAdminProduct, toProductDetail, toProductListItem } from "./product.mapper";
import { productRepository, type ProductFilter } from "./product.repository";

export const productService = {
  async list(query: ProductListQuery): Promise<Paginated<ProductListItem>> {
    const { q, category, crop, featured, sort, page, pageSize } = query;
    const empty = { items: [], page, pageSize, total: 0, totalPages: 0 };

    const filter: ProductFilter = { crop, featured, search: q };
    if (category) {
      const found = await categoryRepository.findActiveBySlug(category);
      if (!found) return empty; // unknown category -> no products, not an error
      filter.categoryId = found._id;
    }

    const [products, total] = await Promise.all([
      productRepository.findMany(filter, { sort, skip: (page - 1) * pageSize, limit: pageSize }),
      productRepository.count(filter),
    ]);

    return {
      items: products.map(toProductListItem),
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    };
  },

  async getBySlug(slug: string): Promise<ProductDetail> {
    const product = await productRepository.findActiveBySlug(slug);
    if (!product) throw AppError.notFound("Product");
    return toProductDetail(product);
  },

  // ---------- Admin ----------

  async listForAdmin({ q, page, pageSize }: AdminProductListQuery): Promise<Paginated<AdminProduct>> {
    const [rows, total] = await productRepository.listForAdmin(q, (page - 1) * pageSize, pageSize);
    return { items: rows.map(toAdminProduct), page, pageSize, total, totalPages: Math.ceil(total / pageSize) };
  },

  async getForAdmin(id: string): Promise<AdminProduct> {
    const product = await productRepository.findByIdForAdmin(id);
    if (!product) throw AppError.notFound("Product");
    return toAdminProduct(product);
  },

  /** Creates (id = null) or updates a product. Existing pack sizes keep their id, so carts stay valid. */
  async save(id: string | null, input: ProductInput): Promise<AdminProduct> {
    const { variants, ...fields } = input;
    const savedId = await productRepository.save(id, {
      ...fields,
      variants: variants.map(({ id: variantId, ...variant }) => ({ ...variant, ...(variantId && { _id: variantId }) })),
    });
    if (!savedId) throw AppError.notFound("Product");
    return this.getForAdmin(savedId);
  },
};
