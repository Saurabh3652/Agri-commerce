import type { Metadata } from "next";
import AdminLoginForm from "@/components/auth/AdminLoginForm";

export const metadata: Metadata = {
  title: "Admin login",
  robots: { index: false, follow: false }, // keep the admin door out of search results
};

export default function AdminLoginPage() {
  return (
    <div className="mx-auto w-full max-w-md px-4 py-8">
      <div className="rounded-2xl border border-line bg-white p-5 shadow-sm sm:p-6">
        <AdminLoginForm />
      </div>
    </div>
  );
}
