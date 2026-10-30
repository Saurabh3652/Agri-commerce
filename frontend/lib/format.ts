/** "29 Oct 2026, 4:05 pm" in the store's timezone (from store settings, never hardcoded). */
export function formatDateTime(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone }).format(new Date(iso));
}

export function formatDate(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeZone }).format(new Date(iso));
}

/** Reads one value from Next's searchParams, where a key can also appear several times. */
export function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
