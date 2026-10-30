import type { CategoryGridSection as CategoryGridSectionData } from "@agri/shared";
import Link from "next/link";
import { getCategories } from "@/lib/api/category.client";
import SectionHeading from "./SectionHeading";

/** Big icon tiles: farmers recognise pictures faster than words. */
export default async function CategoryGridSection({ data }: { data: CategoryGridSectionData["data"] }) {
  const categories = await getCategories(data.categorySlugs);
  if (categories.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4">
      <SectionHeading title={data.title} />
      <ul className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {categories.map((c) => (
          <li key={c.id}>
            <Link
              href={`/products?category=${c.slug}`}
              className="flex h-full flex-col items-center gap-2 rounded-2xl border border-line bg-white p-3 text-center shadow-sm hover:border-brand-600 hover:shadow-md"
            >
              <span className="flex size-14 items-center justify-center rounded-full bg-brand-50 text-3xl" aria-hidden>
                {c.icon ?? "🌱"}
              </span>
              <span className="text-sm font-semibold leading-tight text-ink sm:text-base">{c.name}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
