import type { Category, CategoryListQuery } from "@agri/shared";
import { toCategory } from "./category.mapper";
import { categoryRepository } from "./category.repository";

export const categoryService = {
  async list({ slugs }: CategoryListQuery): Promise<Category[]> {
    const categories = await categoryRepository.findActive(slugs);
    const mapped = categories.map(toCategory);
    // When specific slugs are requested (e.g. by a CMS section), keep the order they were given in.
    return slugs.length > 0 ? mapped.sort((a, b) => slugs.indexOf(a.slug) - slugs.indexOf(b.slug)) : mapped;
  },
};
