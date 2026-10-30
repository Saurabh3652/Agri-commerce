import type { StoreConfig } from "@agri/shared";
import { cacheLife, cacheTag } from "next/cache";
import { apiGet } from "./http";

/** Store rules (COD, limits, timezone). Cached for a minute, so admin changes appear quickly. */
export async function getStoreConfig() {
  "use cache";
  cacheLife("minutes");
  cacheTag("store");
  return apiGet<StoreConfig>("/store/config");
}
