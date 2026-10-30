"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authApi } from "@/lib/api/auth.client";
import { t } from "@/lib/i18n";

export default function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    try {
      await authApi.logout();
    } finally {
      // Even if the call fails, the cookies are gone or invalid: send them home either way.
      router.refresh();
      router.replace("/");
    }
  }

  return (
    <button
      type="button"
      onClick={() => void logout()}
      disabled={busy}
      className="flex h-12 items-center justify-center gap-2 rounded-xl border-2 border-line px-4 text-base font-semibold text-ink hover:bg-brand-50 disabled:opacity-60"
    >
      <LogOut className="size-5" aria-hidden />
      {busy ? t.auth.loggingOut : t.auth.logout}
    </button>
  );
}
