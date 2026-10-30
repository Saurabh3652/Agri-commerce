import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import LoginForm from "@/components/auth/LoginForm";
import { getSession } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Login" };

/** Only internal paths are accepted, so ?next= cannot bounce someone to another website. */
function safeNextPath(next: unknown): string {
  if (typeof next !== "string" || !next.startsWith("/") || next.startsWith("//")) return "/account";
  return next;
}

/**
 * Reads searchParams and the session, so it lives inside <Suspense>: the card shell is
 * prerendered and this streams in at request time.
 */
async function LoginGate({ searchParams }: { searchParams: PageProps<"/login">["searchParams"] }) {
  const { next } = await searchParams;
  const nextPath = safeNextPath(next);

  // Someone already signed in has no reason to see this page.
  if (await getSession()) redirect(nextPath);

  return <LoginForm nextPath={nextPath} />;
}

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <div className="mx-auto w-full max-w-md px-4 py-8">
      <div className="rounded-2xl border border-line bg-white p-5 shadow-sm sm:p-6">
        <Suspense fallback={<div className="h-80 animate-pulse rounded-xl bg-brand-50" aria-busy="true" />}>
          <LoginGate searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}
