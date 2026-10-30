import { BadgeCheck, MapPin, Package, Phone } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import LogoutButton from "@/components/auth/LogoutButton";
import { requireSession } from "@/lib/auth/session";
import { t } from "@/lib/i18n";

export const metadata: Metadata = { title: "My account" };

/**
 * Reads the session, so it sits inside <Suspense>: the page shell is sent immediately
 * and this streams in once the API has validated the cookies.
 */
async function AccountDetails() {
  // Redirects to /login?next=/account when there is no valid session.
  const customer = await requireSession("/account");
  const joined = new Date(customer.createdAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <>
      <section className="rounded-2xl border border-line bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{customer.fullName}</h1>
            <p className="mt-1 flex items-center gap-2 text-base text-ink-muted">
              <Phone className="size-4" aria-hidden />+91 {customer.phone}
            </p>
            <p className="mt-1 text-sm text-ink-muted">{t.auth.memberSince(joined)}</p>
          </div>
          <span className="flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1.5 text-base font-semibold text-brand-700">
            <BadgeCheck className="size-5" aria-hidden />
            {t.auth.roleLabel[customer.role]}
          </span>
        </div>

        <dl className="mt-5 grid gap-3 border-t border-line pt-5 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-ink-muted">Email</dt>
            <dd className="text-base">{customer.email ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-sm text-ink-muted">Age</dt>
            <dd className="text-base">{customer.age ?? "—"}</dd>
          </div>
          {customer.role === "RETAILER" && (
            <div>
              <dt className="text-sm text-ink-muted">GSTIN</dt>
              <dd className="text-base">{customer.gstin ?? "—"}</dd>
            </div>
          )}
        </dl>
      </section>

      <section className="mt-6 rounded-2xl border border-line bg-white p-5 shadow-sm">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <MapPin className="size-5 text-brand-700" aria-hidden />
          {t.auth.addresses}
        </h2>
        {customer.addresses.length === 0 ? (
          <p className="mt-3 text-base text-ink-muted">{t.auth.noAddresses}</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-3">
            {customer.addresses.map((address) => (
              <li key={address.id} className="rounded-xl bg-brand-50 p-4">
                <p className="flex flex-wrap items-center gap-2 font-semibold">
                  {address.label ?? address.name}
                  {address.isDefault && (
                    <span className="rounded bg-brand-600 px-2 py-0.5 text-xs font-bold text-white">Default</span>
                  )}
                </p>
                <p className="mt-1 text-base text-ink-muted">
                  {[address.line1, address.village, address.taluka, address.district, address.pincode]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/orders"
          className="flex h-12 items-center gap-2 rounded-xl bg-brand-600 px-5 text-base font-semibold text-white hover:bg-brand-700"
        >
          <Package className="size-5" aria-hidden />
          {t.auth.orders}
        </Link>
        <LogoutButton />
      </div>
    </>
  );
}

function AccountSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true">
      <div className="h-52 animate-pulse rounded-2xl bg-white" />
      <div className="h-32 animate-pulse rounded-2xl bg-white" />
    </div>
  );
}

export default function AccountPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <Suspense fallback={<AccountSkeleton />}>
        <AccountDetails />
      </Suspense>
    </div>
  );
}
