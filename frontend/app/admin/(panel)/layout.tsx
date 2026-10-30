import { redirect } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import AdminNav from "@/components/admin/AdminNav";
import { getSiteSettings } from "@/lib/api/content.client";
import { getSession } from "@/lib/auth/session";

/**
 * Keeps non-admins from seeing the admin chrome. It is NOT the security boundary: a page
 * renders in parallel with its layout, so admin pages also read data through serverGet()
 * (which redirects on 401/403), and the API checks the ADMIN role on every /admin request.
 */
async function AdminGate({ children }: { children: ReactNode }) {
  const user = await getSession();
  if (!user) redirect("/admin/login");
  if (user.role !== "ADMIN") redirect("/");
  return children;
}

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const { siteName } = await getSiteSettings();
  return (
    <div className="min-h-screen md:flex">
      <AdminNav siteName={siteName} />
      <main className="min-w-0 flex-1 px-4 py-6 md:px-8">
        <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-white" aria-busy="true" />}>
          <AdminGate>{children}</AdminGate>
        </Suspense>
      </main>
    </div>
  );
}
