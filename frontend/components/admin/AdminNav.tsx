"use client";

import { LayoutDashboard, Leaf, Package, Settings, ShoppingBag, Store, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { t } from "@/lib/i18n";

const LINKS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/admin", label: t.admin.nav.dashboard, icon: LayoutDashboard },
  { href: "/admin/orders", label: t.admin.nav.orders, icon: ShoppingBag },
  { href: "/admin/products", label: t.admin.nav.products, icon: Package },
  { href: "/admin/settings", label: t.admin.nav.settings, icon: Settings },
];

/** The links themselves. `pathname` is null while the current URL is still unknown. */
function NavLinks({ pathname }: { pathname: string | null }) {
  const isActive = (href: string) =>
    pathname !== null && (href === "/admin" ? pathname === href : pathname.startsWith(href));

  return (
    <ul className="flex gap-1 md:flex-col">
      {LINKS.map(({ href, label, icon: Icon }) => (
        <li key={href} className="shrink-0">
          <Link
            href={href}
            aria-current={isActive(href) ? "page" : undefined}
            className={`flex h-11 items-center gap-3 rounded-lg px-3 text-base font-medium ${
              isActive(href) ? "bg-white text-brand-900" : "text-white/85 hover:bg-white/10"
            }`}
          >
            <Icon className="size-5" aria-hidden />
            {label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function ActiveNavLinks() {
  return <NavLinks pathname={usePathname()} />;
}

/** Sidebar on wide screens, a scrollable tab bar on phones. */
export default function AdminNav({ siteName }: { siteName: string }) {
  return (
    <aside className="bg-brand-900 text-white md:sticky md:top-0 md:flex md:h-screen md:w-60 md:shrink-0 md:flex-col">
      <div className="flex items-center gap-2 px-4 py-4">
        <Leaf className="size-6" aria-hidden />
        <span className="text-lg font-bold">{siteName}</span>
        <span className="rounded bg-white/15 px-2 py-0.5 text-xs font-semibold uppercase tracking-wider">
          {t.admin.panel}
        </span>
      </div>
      <nav className="overflow-x-auto px-2 pb-2 md:flex-1 md:overflow-visible">
        {/* The current URL is request data, so the highlight streams in; the links show at once. */}
        <Suspense fallback={<NavLinks pathname={null} />}>
          <ActiveNavLinks />
        </Suspense>
      </nav>
      <Link
        href="/"
        className="hidden items-center gap-2 border-t border-white/10 px-5 py-4 text-sm text-white/80 hover:text-white md:flex"
      >
        <Store className="size-4" aria-hidden />
        {t.admin.viewShop}
      </Link>
    </aside>
  );
}
