"use client";

import { Loader2, LogIn } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authApi } from "@/lib/api/auth.client";
import { describeError } from "@/lib/api/browser";
import { t } from "@/lib/i18n";

const field =
  "h-14 w-full rounded-xl border-2 border-line bg-white px-4 text-lg text-ink focus:border-brand-600 focus:outline-none focus:ring-3 focus:ring-brand-600/20";

export default function AdminLoginForm() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await authApi.adminLogin(phone, password);
      router.refresh();
      router.replace("/admin");
    } catch (err) {
      setError(describeError(err, t.state.networkError));
      setPassword("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
      className="flex flex-col gap-5"
      noValidate
    >
      <h1 className="text-2xl font-bold">{t.auth.adminTitle}</h1>

      <div>
        <label htmlFor="admin-phone" className="mb-1 block text-base font-semibold">
          {t.auth.phoneLabel}
        </label>
        <input
          id="admin-phone"
          type="tel"
          inputMode="numeric"
          autoComplete="username"
          required
          maxLength={10}
          value={phone}
          onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
          className={field}
        />
      </div>

      <div>
        <label htmlFor="admin-password" className="mb-1 block text-base font-semibold">
          {t.auth.password}
        </label>
        <input
          id="admin-password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={field}
        />
      </div>

      {error && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-base font-medium text-red-800">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy || phone.length !== 10 || password.length === 0}
        className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 text-lg font-bold text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {busy ? <Loader2 className="size-5 animate-spin" aria-hidden /> : <LogIn className="size-5" aria-hidden />}
        {t.auth.signIn}
      </button>
    </form>
  );
}
