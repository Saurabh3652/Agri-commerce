import { UserRound } from "lucide-react";
import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { t } from "@/lib/i18n";

/**
 * Shows the customer's first name once signed in, otherwise a login link.
 * Reads cookies, so the navbar renders it inside <Suspense>.
 */
export default async function AccountLink() {
  const customer = await getSession();

  return (
    <Link
      href={customer ? "/account" : "/login"}
      className="flex h-12 items-center gap-2 rounded-xl px-3 text-white hover:bg-white/10"
    >
      <UserRound className="size-7" aria-hidden />
      <span className="hidden max-w-28 truncate text-base font-semibold sm:inline">
        {customer ? customer.firstName : t.auth.loginTitle.split(" ")[0]}
      </span>
    </Link>
  );
}

export function AccountLinkSkeleton() {
  return (
    <span className="flex h-12 items-center gap-2 px-3 text-white" aria-hidden>
      <UserRound className="size-7" />
      <span className="hidden h-4 w-12 animate-pulse rounded bg-white/25 sm:inline" />
    </span>
  );
}
