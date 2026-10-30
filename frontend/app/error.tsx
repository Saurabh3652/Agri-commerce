"use client";

import { t } from "@/lib/i18n";

// Shown when a page fails to render (for example the API is unreachable).
export default function PageError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-20 text-center">
      <p className="text-lg">{t.state.pageError}</p>
      <button
        type="button"
        onClick={reset}
        className="h-12 rounded-xl bg-brand-600 px-6 text-base font-semibold text-white hover:bg-brand-700"
      >
        {t.state.retry}
      </button>
    </div>
  );
}
