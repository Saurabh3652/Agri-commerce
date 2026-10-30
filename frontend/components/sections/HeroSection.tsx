import type { HeroSection as HeroSectionData } from "@agri/shared";
import CmsLink from "@/components/ui/CmsLink";
import Icon from "@/components/ui/Icon";

export default function HeroSection({ data }: { data: HeroSectionData["data"] }) {
  const { eyebrow, title, subtitle, primaryCta, secondaryCta, backgroundImageUrl, highlights } = data;

  return (
    <section
      className="relative bg-gradient-to-br from-brand-600 to-brand-800 bg-cover bg-center text-white"
      style={
        backgroundImageUrl
          ? {
              // dark overlay keeps text readable on any photo
              backgroundImage: `linear-gradient(rgb(0 0 0 / 0.55), rgb(0 0 0 / 0.55)), url("${backgroundImageUrl}")`,
            }
          : undefined
      }
    >
      <div className="mx-auto max-w-7xl px-4 py-8 md:py-12">
        {eyebrow && (
          <p className="mb-3 inline-block rounded-full bg-white/15 px-3 py-1 text-sm font-semibold">{eyebrow}</p>
        )}
        <h1 className="max-w-2xl text-3xl font-bold leading-tight text-balance md:text-4xl">{title}</h1>
        {subtitle && <p className="mt-3 max-w-2xl text-lg text-brand-50">{subtitle}</p>}

        {(primaryCta || secondaryCta) && (
          <div className="mt-6 flex flex-wrap gap-3">
            {primaryCta && (
              <CmsLink
                href={primaryCta.href}
                className="inline-flex h-12 items-center rounded-xl bg-accent-400 px-6 text-lg font-bold text-ink hover:bg-accent-500"
              >
                {primaryCta.label}
              </CmsLink>
            )}
            {secondaryCta && (
              <CmsLink
                href={secondaryCta.href}
                className="inline-flex h-12 items-center rounded-xl border-2 border-white/70 px-6 text-lg font-semibold text-white hover:bg-white/10"
              >
                {secondaryCta.label}
              </CmsLink>
            )}
          </div>
        )}

        {highlights.length > 0 && (
          <ul className="mt-8 grid gap-3 sm:grid-cols-3">
            {highlights.map((h) => (
              <li key={h.label} className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3">
                <Icon name={h.icon} className="size-7 shrink-0" />
                <span className="text-base font-semibold">{h.label}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
