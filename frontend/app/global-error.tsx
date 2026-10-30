"use client";

import { t } from "@/lib/i18n";
import "./globals.css";

// Shown when the root layout itself fails (for example site settings could not be loaded).
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-lg">{t.state.pageError}</p>
        <button
          type="button"
          onClick={reset}
          className="h-12 rounded-xl bg-brand-600 px-6 text-base font-semibold text-white hover:bg-brand-700"
        >
          {t.state.retry}
        </button>
      </body>
    </html>
  );
}
