import type { Navigation, SiteSettings } from "@agri/shared";
import { Leaf, Mail, MessageCircle, Phone } from "lucide-react";
import Link from "next/link";
import CmsLink from "@/components/ui/CmsLink";
import { t } from "@/lib/i18n";

type Props = { settings: SiteSettings; menu: Navigation };

/** About text, contact details and link columns all come from the CMS. */
export default function Footer({ settings, menu }: Props) {
  const { siteName, footer, contact } = settings;

  return (
    <footer className="mt-12 bg-brand-900 text-brand-50">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Link href="/" className="flex items-center gap-2 text-xl font-bold text-white">
            <Leaf className="size-6" aria-hidden />
            {siteName}
          </Link>
          {footer.about && <p className="mt-3 leading-relaxed text-brand-100">{footer.about}</p>}
        </div>

        {menu.items.map((column) => (
          <div key={column.label}>
            <h2 className="text-lg font-semibold text-white">{column.label}</h2>
            <ul className="mt-3 space-y-2">
              {column.children.map((link) => (
                <li key={link.href}>
                  <CmsLink href={link.href} className="text-brand-100 hover:text-white hover:underline">
                    {link.label}
                  </CmsLink>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div>
          <h2 className="text-lg font-semibold text-white">{t.footer.contact}</h2>
          <div className="mt-3 flex flex-col gap-3">
            {contact.phone && (
              <a
                href={`tel:${contact.phone.replace(/\s/g, "")}`}
                className="flex h-12 items-center gap-3 rounded-xl bg-white/10 px-4 font-semibold text-white hover:bg-white/20"
              >
                <Phone className="size-5" aria-hidden />
                {contact.phone}
              </a>
            )}
            {contact.whatsapp && (
              <a
                href={`https://wa.me/${contact.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-12 items-center gap-3 rounded-xl bg-[#25D366] px-4 font-semibold text-ink hover:brightness-95"
              >
                <MessageCircle className="size-5" aria-hidden />
                {t.footer.whatsapp}
              </a>
            )}
            {contact.email && (
              <a href={`mailto:${contact.email}`} className="flex items-center gap-2 text-brand-100 hover:text-white">
                <Mail className="size-4" aria-hidden />
                {contact.email}
              </a>
            )}
            {contact.hours && <p className="text-sm text-brand-100">{contact.hours}</p>}
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <p className="mx-auto max-w-7xl px-4 py-4 text-sm text-brand-100">{footer.copyright}</p>
      </div>
    </footer>
  );
}
