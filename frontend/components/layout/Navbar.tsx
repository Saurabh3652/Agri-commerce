import type { Navigation, SiteSettings } from "@agri/shared";
import { Leaf, Search } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import CartButton from "@/components/cart/CartButton";
import AccountLink, { AccountLinkSkeleton } from "@/components/layout/AccountLink";
import CmsLink from "@/components/ui/CmsLink";
import Icon from "@/components/ui/Icon";
import { t } from "@/lib/i18n";

type Props = { settings: SiteSettings; menu: Navigation };

function SearchForm({ placeholder, className = "" }: { placeholder: string; className?: string }) {
  return (
    <form action="/products" role="search" className={`flex w-full ${className}`}>
      <label htmlFor="site-search" className="sr-only">
        {t.nav.search}
      </label>
      <input
        id="site-search"
        name="q"
        type="search"
        placeholder={placeholder}
        className="h-12 w-full min-w-0 rounded-l-xl border-0 bg-white px-4 text-base text-ink placeholder:text-ink-muted focus:outline-none focus:ring-3 focus:ring-accent-400"
      />
      <button
        type="submit"
        aria-label={t.nav.search}
        className="flex h-12 w-14 shrink-0 items-center justify-center rounded-r-xl bg-accent-400 text-ink hover:bg-accent-500"
      >
        <Search className="size-6" aria-hidden />
      </button>
    </form>
  );
}

/** Everything shown here (name, logo, search text, menu items) comes from the CMS. */
export default function Navbar({ settings, menu }: Props) {
  const { siteName, logoUrl, header } = settings;

  return (
    <header className="sticky top-0 z-40 bg-brand-700 shadow-md">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2">
        <Link href="/" aria-label={`${siteName} – ${t.nav.home}`} className="flex shrink-0 items-center gap-2 text-white">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- CMS logos can come from any host
            <img src={logoUrl} alt="" className="h-10 w-auto" />
          ) : (
            <span className="flex size-10 items-center justify-center rounded-full bg-white/15">
              <Leaf className="size-6" aria-hidden />
            </span>
          )}
          <span className="text-xl font-bold tracking-tight">{siteName}</span>
        </Link>

        {header.showSearch && (
          <SearchForm placeholder={header.searchPlaceholder} className="mx-4 hidden max-w-2xl md:flex" />
        )}

        <div className="ml-auto flex items-center gap-1">
          <Suspense fallback={<AccountLinkSkeleton />}>
            <AccountLink />
          </Suspense>
          <CartButton />
        </div>
      </div>

      {header.showSearch && (
        <div className="px-4 pb-2 md:hidden">
          <SearchForm placeholder={header.searchPlaceholder} />
        </div>
      )}

      {menu.items.length > 0 && (
        <nav aria-label={t.nav.menu} className="border-t border-white/10 bg-brand-800">
          {/* Scrolls sideways on phones instead of wrapping into a tall block */}
          <ul className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-2 py-1.5 [scrollbar-width:none]">
            {menu.items.map((item) => (
              <li key={item.href} className="shrink-0">
                <CmsLink
                  href={item.href}
                  className="flex h-10 items-center gap-2 rounded-lg px-3 text-[15px] font-medium text-white/90 hover:bg-white/10 hover:text-white"
                >
                  {item.icon && <Icon name={item.icon} className="size-4" />}
                  {item.label}
                </CmsLink>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
