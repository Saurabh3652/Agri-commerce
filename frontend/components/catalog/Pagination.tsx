import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { t } from "@/lib/i18n";

type Props = { page: number; totalPages: number; hrefFor: (page: number) => string };

/** Big previous / next buttons. Page numbers are hard to tap on small phones. */
export default function Pagination({ page, totalPages, hrefFor }: Props) {
  if (totalPages <= 1) return null;
  const button =
    "flex h-12 items-center gap-1 rounded-xl border-2 border-line bg-white px-4 text-base font-semibold hover:border-brand-600";

  return (
    <nav className="mt-8 flex items-center justify-between gap-3" aria-label="Pagination">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} className={button}>
          <ChevronLeft className="size-5" aria-hidden />
          {t.catalog.previous}
        </Link>
      ) : (
        <span />
      )}
      <span className="text-base text-ink-muted">{t.catalog.page(page, totalPages)}</span>
      {page < totalPages ? (
        <Link href={hrefFor(page + 1)} className={button}>
          {t.catalog.next}
          <ChevronRight className="size-5" aria-hidden />
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
