import type { Category } from "@agri/shared";
import type { CategoryRecord } from "./category.model";

/** Database document -> API shape. Hides internal fields like isActive and translations. */
export function toCategory(c: CategoryRecord): Category {
  return {
    id: c._id.toString(),
    slug: c.slug,
    name: c.name,
    icon: c.icon ?? null,
    imageUrl: c.imageUrl ?? null,
    parentId: c.parentId?.toString() ?? null,
    sortOrder: c.sortOrder,
  };
}
