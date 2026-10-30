import type { Category } from "@agri/shared";
import { cacheLife, cacheTag } from "next/cache";
import { apiGet, toQueryString } from "./http";

export async function getCategories(slugs: string[] = []) {
  "use cache";
  cacheLife("hours");
  cacheTag("categories");
  return apiGet<Category[]>(`/categories${toQueryString({ slugs })}`);
}
