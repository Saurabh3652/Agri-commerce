import type { Metadata } from "next";
import Link from "next/link";
import ProductForm from "@/components/admin/ProductForm";
import { getCategories } from "@/lib/api/category.client";
import { t } from "@/lib/i18n";

export const metadata: Metadata = { title: "New product" };

export default async function NewProductPage() {
  const categories = await getCategories();
  return (
    <div className="flex flex-col gap-4">
      <Link href="/admin/products" className="text-base font-semibold text-brand-700 hover:underline">
        ← {t.admin.nav.products}
      </Link>
      <h1 className="text-2xl font-bold">{t.admin.products.newTitle}</h1>
      <ProductForm product={null} categories={categories} />
    </div>
  );
}
