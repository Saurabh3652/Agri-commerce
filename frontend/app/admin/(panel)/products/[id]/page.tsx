import type { AdminProduct } from "@agri/shared";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, unstable_rethrow } from "next/navigation";
import ProductForm from "@/components/admin/ProductForm";
import { getCategories } from "@/lib/api/category.client";
import { ApiRequestError } from "@/lib/api/http";
import { serverGet } from "@/lib/api/server";
import { t } from "@/lib/i18n";

export const metadata: Metadata = { title: "Edit product" };

async function loadProduct(id: string) {
  try {
    return await serverGet<AdminProduct>(`/admin/products/${id}`);
  } catch (err) {
    unstable_rethrow(err);
    if (err instanceof ApiRequestError && (err.status === 404 || err.status === 400)) notFound();
    throw err;
  }
}

export default async function EditProductPage({ params }: PageProps<"/admin/products/[id]">) {
  const { id } = await params;
  const [product, categories] = await Promise.all([loadProduct(id), getCategories()]);

  return (
    <div className="flex flex-col gap-4">
      <Link href="/admin/products" className="text-base font-semibold text-brand-700 hover:underline">
        ← {t.admin.nav.products}
      </Link>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-2xl font-bold">{product.name}</h1>
        <Link href={`/products/${product.slug}`} className="text-base text-brand-700 hover:underline">
          {t.admin.viewShop} →
        </Link>
      </div>
      <ProductForm product={product} categories={categories} />
    </div>
  );
}
