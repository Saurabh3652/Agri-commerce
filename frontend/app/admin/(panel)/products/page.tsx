import { adminProductListQuerySchema, formatPaise, type AdminProduct, type Paginated } from "@agri/shared";
import { Plus, Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import Pagination from "@/components/catalog/Pagination";
import { cardClass, inputClass, primaryButtonClass } from "@/components/ui/styles";
import { toQueryString } from "@/lib/api/http";
import { serverGet } from "@/lib/api/server";
import { getStoreConfig } from "@/lib/api/store.client";
import { firstParam } from "@/lib/format";
import { t } from "@/lib/i18n";

export const metadata: Metadata = { title: "Admin products" };

/** "₹180 – ₹850" across the pack sizes that are on sale. */
function priceRange(product: AdminProduct) {
  const prices = product.variants.filter((v) => v.isActive).map((v) => v.pricePaise);
  if (prices.length === 0) return "—";
  const [low, high] = [Math.min(...prices), Math.max(...prices)];
  return low === high ? formatPaise(low) : `${formatPaise(low)} – ${formatPaise(high)}`;
}

export default async function AdminProductsPage({ searchParams }: PageProps<"/admin/products">) {
  const raw = await searchParams;
  const parsed = adminProductListQuerySchema.safeParse({ q: firstParam(raw.q), page: firstParam(raw.page) });
  const query = parsed.success ? parsed.data : adminProductListQuerySchema.parse({});

  const [products, store] = await Promise.all([
    serverGet<Paginated<AdminProduct>>(`/admin/products${toQueryString(query)}`),
    getStoreConfig(),
  ]);
  const p = t.admin.products;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{t.admin.nav.products}</h1>
        <Link href="/admin/products/new" className={primaryButtonClass}>
          <Plus className="size-5" aria-hidden />
          {p.newProduct}
        </Link>
      </div>

      <form action="/admin/products" className="flex max-w-md gap-2">
        <input name="q" defaultValue={query.q} placeholder={p.search} className={inputClass} />
        <button type="submit" aria-label={t.nav.search} className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white">
          <Search className="size-5" aria-hidden />
        </button>
      </form>

      <section className={`${cardClass} overflow-x-auto p-0`}>
        {products.items.length === 0 ? (
          <p className="p-5 text-base text-ink-muted">{p.empty}</p>
        ) : (
          <table className="w-full min-w-[44rem] text-left text-sm">
            <thead className="border-b border-line text-ink-muted">
              <tr>
                {[p.columns.product, p.columns.category, p.columns.price, p.columns.stock, p.columns.status].map((h) => (
                  <th key={h} scope="col" className="px-4 py-3 font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {products.items.map((product) => {
                const stock = product.variants.filter((v) => v.isActive).reduce((sum, v) => sum + v.stock, 0);
                return (
                  <tr key={product.id} className="hover:bg-brand-50">
                    <td className="px-4 py-3">
                      <Link href={`/admin/products/${product.id}`} className="flex items-center gap-3">
                        <span className="text-2xl" aria-hidden>
                          {product.icon ?? "🌱"}
                        </span>
                        <span>
                          <span className="block font-semibold text-brand-700 hover:underline">{product.name}</span>
                          <span className="text-ink-muted">{p.packSizes(product.variants.length)}</span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3">{product.categoryName}</td>
                    <td className="px-4 py-3 tabular-nums">{priceRange(product)}</td>
                    <td className={`px-4 py-3 font-semibold tabular-nums ${stock <= store.lowStockThreshold ? "text-warn" : ""}`}>
                      {stock}
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex flex-wrap gap-1">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                            product.isActive ? "bg-brand-100 text-brand-800" : "bg-gray-200 text-gray-700"
                          }`}
                        >
                          {product.isActive ? p.active : p.hidden}
                        </span>
                        {product.isFeatured && (
                          <span className="rounded-full bg-accent-400/30 px-2 py-0.5 text-xs font-semibold">{p.featured}</span>
                        )}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      <Pagination
        page={products.page}
        totalPages={products.totalPages}
        hrefFor={(page) => `/admin/products${toQueryString({ q: query.q, page })}`}
      />
    </div>
  );
}
