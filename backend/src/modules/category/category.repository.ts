// Repository = the only place that talks to MongoDB for categories.
import { CategoryModel, type CategoryRecord } from "./category.model";

export const categoryRepository = {
  findActive(slugs: string[] = []) {
    return CategoryModel.find({ isActive: true, ...(slugs.length > 0 && { slug: { $in: slugs } }) })
      .sort({ sortOrder: 1, name: 1 })
      .lean<CategoryRecord[]>();
  },

  findActiveBySlug(slug: string) {
    return CategoryModel.findOne({ slug, isActive: true }).lean<CategoryRecord>();
  },
};
