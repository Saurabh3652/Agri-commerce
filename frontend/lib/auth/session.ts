import type { Customer } from "@agri/shared";
import { redirect } from "next/navigation";
import { fetchAsVisitor } from "../api/server";

/** The signed-in customer, or null. Must be rendered inside <Suspense> (it reads cookies). */
export async function getSession(): Promise<Customer | null> {
  try {
    const { customer } = await fetchAsVisitor<{ customer: Customer }>("/auth/me");
    return customer;
  } catch {
    return null; // no cookie, or an expired/invalid session: treated as signed out
  }
}

/** Use in a page that requires login. Sends the visitor to /login and back again afterwards. */
export async function requireSession(returnTo: string): Promise<Customer> {
  const customer = await getSession();
  if (!customer) redirect(`/login?next=${encodeURIComponent(returnTo)}`);
  return customer;
}
