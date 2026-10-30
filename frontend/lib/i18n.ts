import { en, type Messages } from "@/messages/en";

// Single dictionary for now. When Gujarati is added, resolve the locale
// (cookie or /[locale] route segment) and return the matching dictionary.
export const t: Messages = en;
