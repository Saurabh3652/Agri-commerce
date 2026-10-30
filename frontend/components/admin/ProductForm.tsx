"use client";

import { paiseToRupees, productInputSchema, rupeesToPaise, type AdminProduct, type Category } from "@agri/shared";
import { Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { cardClass, errorClass, inputClass, labelClass, primaryButtonClass, secondaryButtonClass } from "@/components/ui/styles";
import { adminApi } from "@/lib/api/admin.client";
import { describeError } from "@/lib/api/browser";
import { t } from "@/lib/i18n";

const f = t.admin.productForm;

/** Form fields hold text exactly as typed; numbers and paise are converted only on save. */
type VariantDraft = {
  id?: string;
  sku: string;
  label: string;
  unit: string;
  price: string;
  mrp: string;
  retailerPrice: string;
  minOrderQty: string;
  stock: string;
  isActive: boolean;
};

const emptyVariant = (): VariantDraft => ({
  sku: "",
  label: "",
  unit: "kg",
  price: "",
  mrp: "",
  retailerPrice: "",
  minOrderQty: "1",
  stock: "0",
  isActive: true,
});

const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const orNull = (text: string) => text.trim() || null;

function fieldsFrom(product: AdminProduct | null) {
  return {
    name: product?.name ?? "",
    slug: product?.slug ?? "",
    categoryId: product?.categoryId ?? "",
    brand: product?.brand ?? "",
    icon: product?.icon ?? "",
    description: product?.description ?? "",
    usageInstructions: product?.usageInstructions ?? "",
    images: product?.images.join("\n") ?? "",
    crops: product?.crops.join(", ") ?? "",
    isActive: product?.isActive ?? true,
    isFeatured: product?.isFeatured ?? false,
  };
}

function variantsFrom(product: AdminProduct | null): VariantDraft[] {
  if (!product) return [emptyVariant()];
  return product.variants.map((v) => ({
    id: v.id,
    sku: v.sku,
    label: v.label,
    unit: v.unit,
    price: String(paiseToRupees(v.pricePaise)),
    mrp: String(paiseToRupees(v.mrpPaise)),
    retailerPrice: v.retailerPricePaise === null ? "" : String(paiseToRupees(v.retailerPricePaise)),
    minOrderQty: String(v.minOrderQty),
    stock: String(v.stock),
    isActive: v.isActive,
  }));
}

export default function ProductForm({ product, categories }: { product: AdminProduct | null; categories: Category[] }) {
  const router = useRouter();
  const [fields, setFields] = useState(() => fieldsFrom(product));
  const [variants, setVariants] = useState(() => variantsFrom(product));
  // A new product's URL name follows its name until someone edits it by hand.
  const [isSlugEdited, setIsSlugEdited] = useState(Boolean(product));
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ tone: "error" | "ok"; text: string } | null>(null);

  const setField = <K extends keyof typeof fields>(key: K, value: (typeof fields)[K]) =>
    setFields((current) => ({
      ...current,
      [key]: value,
      ...(key === "name" && !isSlugEdited && { slug: slugify(String(value)) }),
    }));

  const setVariant = (index: number, changes: Partial<VariantDraft>) =>
    setVariants((current) => current.map((v, i) => (i === index ? { ...v, ...changes } : v)));

  function buildInput() {
    return productInputSchema.safeParse({
      name: fields.name,
      slug: fields.slug,
      categoryId: fields.categoryId,
      brand: orNull(fields.brand),
      icon: orNull(fields.icon),
      description: fields.description,
      usageInstructions: orNull(fields.usageInstructions),
      images: fields.images.split("\n").map((s) => s.trim()).filter(Boolean),
      crops: fields.crops.split(",").map((s) => s.trim()).filter(Boolean),
      isActive: fields.isActive,
      isFeatured: fields.isFeatured,
      variants: variants.map((v) => ({
        ...(v.id && { id: v.id }),
        sku: v.sku,
        label: v.label,
        unit: v.unit,
        pricePaise: rupeesToPaise(Number(v.price)),
        mrpPaise: rupeesToPaise(Number(v.mrp)),
        retailerPricePaise: v.retailerPrice.trim() ? rupeesToPaise(Number(v.retailerPrice)) : null,
        minOrderQty: Number(v.minOrderQty),
        stock: Number(v.stock),
        isActive: v.isActive,
      })),
    });
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    const parsed = buildInput();
    if (!parsed.success) {
      // Same rules as the API, so problems show before anything is sent.
      const issue = parsed.error.issues[0]!;
      const where = issue.path[0] === "variants" ? `${f.packSizes} ${Number(issue.path[1]) + 1}: ` : "";
      setMessage({ tone: "error", text: `${where}${issue.message}` });
      return;
    }

    setIsSaving(true);
    setMessage(null);
    try {
      const saved = await adminApi.saveProduct(product?.id ?? null, parsed.data);
      if (!product) {
        router.replace(`/admin/products/${saved.id}`);
        return;
      }
      // Show exactly what was stored: new pack sizes now have their permanent ids.
      setFields(fieldsFrom(saved));
      setVariants(variantsFrom(saved));
      setMessage({ tone: "ok", text: f.saved });
      router.refresh();
    } catch (err) {
      setMessage({ tone: "error", text: describeError(err, t.state.networkError) });
    } finally {
      setIsSaving(false);
    }
  }

  const textField = (key: "name" | "brand" | "icon", label: string) => (
    <div>
      <label htmlFor={`product-${key}`} className={labelClass}>
        {label}
      </label>
      <input id={`product-${key}`} value={fields[key]} onChange={(e) => setField(key, e.target.value)} className={inputClass} />
    </div>
  );

  const textArea = (key: "description" | "usageInstructions" | "images", label: string, rows = 4) => (
    <div className="sm:col-span-2">
      <label htmlFor={`product-${key}`} className={labelClass}>
        {label}
      </label>
      <textarea
        id={`product-${key}`}
        rows={rows}
        value={fields[key]}
        onChange={(e) => setField(key, e.target.value)}
        className={`${inputClass} h-auto py-2`}
      />
    </div>
  );

  const variantColumns: { key: keyof VariantDraft; label: string; numeric?: boolean }[] = [
    { key: "sku", label: f.sku },
    { key: "label", label: f.label },
    { key: "unit", label: f.unit },
    { key: "price", label: f.price, numeric: true },
    { key: "mrp", label: f.mrp, numeric: true },
    { key: "retailerPrice", label: f.retailerPrice, numeric: true },
    { key: "minOrderQty", label: f.minQty, numeric: true },
    { key: "stock", label: f.stock, numeric: true },
  ];

  return (
    <form onSubmit={save} className="flex flex-col gap-6" noValidate>
      <section className={`${cardClass} grid gap-4 sm:grid-cols-2`}>
        <h2 className="text-lg font-bold sm:col-span-2">{f.basics}</h2>
        {textField("name", f.name)}
        <div>
          <label htmlFor="product-slug" className={labelClass}>
            {f.slug}
          </label>
          <input
            id="product-slug"
            value={fields.slug}
            onChange={(e) => {
              setIsSlugEdited(true);
              setField("slug", e.target.value);
            }}
            className={inputClass}
          />
          <p className="mt-1 text-xs text-ink-muted">{f.slugHint}</p>
        </div>
        <div>
          <label htmlFor="product-category" className={labelClass}>
            {f.category}
          </label>
          <select
            id="product-category"
            value={fields.categoryId}
            onChange={(e) => setField("categoryId", e.target.value)}
            className={inputClass}
          >
            <option value="">{f.chooseCategory}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon} {c.name}
              </option>
            ))}
          </select>
        </div>
        {textField("brand", f.brand)}
        {textField("icon", f.icon)}
        <div>
          <label htmlFor="product-crops" className={labelClass}>
            {f.crops}
          </label>
          <input id="product-crops" value={fields.crops} onChange={(e) => setField("crops", e.target.value)} className={inputClass} />
        </div>
        {textArea("description", f.description, 5)}
        {textArea("usageInstructions", f.usage, 3)}
        {textArea("images", f.images, 2)}
      </section>

      <section className={cardClass}>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold">{f.packSizes}</h2>
          <button type="button" onClick={() => setVariants((v) => [...v, emptyVariant()])} className={secondaryButtonClass}>
            <Plus className="size-5" aria-hidden />
            {f.addPackSize}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[60rem] text-left text-sm">
            <thead className="text-ink-muted">
              <tr>
                {variantColumns.map((col) => (
                  <th key={col.key} scope="col" className="px-1 pb-2 font-semibold">
                    {col.label}
                  </th>
                ))}
                <th scope="col" className="px-1 pb-2 font-semibold">
                  {f.sellable}
                </th>
                <th />
              </tr>
            </thead>
            <tbody>
              {variants.map((variant, index) => (
                <tr key={variant.id ?? `new-${index}`}>
                  {variantColumns.map((col) => (
                    <td key={col.key} className="px-1 py-1">
                      <input
                        aria-label={`${col.label} ${index + 1}`}
                        value={String(variant[col.key] ?? "")}
                        inputMode={col.numeric ? "decimal" : undefined}
                        onChange={(e) => setVariant(index, { [col.key]: e.target.value })}
                        className={`${inputClass} h-10 px-2`}
                      />
                    </td>
                  ))}
                  <td className="px-1 py-1 text-center">
                    <input
                      type="checkbox"
                      aria-label={`${f.sellable} ${index + 1}`}
                      checked={variant.isActive}
                      onChange={(e) => setVariant(index, { isActive: e.target.checked })}
                      className="size-5 accent-brand-600"
                    />
                  </td>
                  <td className="px-1 py-1">
                    <button
                      type="button"
                      onClick={() => setVariants((v) => v.filter((_, i) => i !== index))}
                      disabled={variants.length === 1}
                      aria-label={`${f.removePackSize} ${index + 1}`}
                      className="flex size-10 items-center justify-center rounded-lg text-ink-muted hover:bg-red-50 hover:text-red-700 disabled:opacity-30"
                    >
                      <Trash2 className="size-5" aria-hidden />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className={`${cardClass} flex flex-wrap gap-6`}>
        <h2 className="w-full text-lg font-bold">{f.visibility}</h2>
        {(["isActive", "isFeatured"] as const).map((key) => (
          <label key={key} className="flex items-center gap-2 text-base">
            <input
              type="checkbox"
              checked={fields[key]}
              onChange={(e) => setField(key, e.target.checked)}
              className="size-5 accent-brand-600"
            />
            {f[key]}
          </label>
        ))}
      </section>

      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" disabled={isSaving} className={primaryButtonClass}>
          {isSaving ? f.saving : f.save}
        </button>
        {message && (
          <p className={message.tone === "error" ? errorClass : "text-base font-semibold text-brand-700"} role="status">
            {message.text}
          </p>
        )}
      </div>
    </form>
  );
}
