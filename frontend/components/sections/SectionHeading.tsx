import type { Link as LinkData } from "@agri/shared";
import { ChevronRight } from "lucide-react";
import CmsLink from "@/components/ui/CmsLink";

export default function SectionHeading({ title, link }: { title: string; link?: LinkData | null }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <h2 className="text-2xl font-bold text-balance">{title}</h2>
      {link && (
        <CmsLink
          href={link.href}
          className="flex shrink-0 items-center gap-1 text-base font-semibold text-brand-700 hover:underline"
        >
          {link.label}
          <ChevronRight className="size-5" aria-hidden />
        </CmsLink>
      )}
    </div>
  );
}
