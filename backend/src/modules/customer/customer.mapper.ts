import type { Address, Customer, Locale, Role } from "@agri/shared";
import type { AddressRecord, CustomerRecord } from "./customer.model";

/** Age is derived on read, so it can never be a stale stored number. */
function ageFrom(dateOfBirth: Date | null): number | null {
  if (!dateOfBirth) return null;
  const now = new Date();
  let age = now.getFullYear() - dateOfBirth.getFullYear();
  const beforeBirthdayThisYear =
    now.getMonth() < dateOfBirth.getMonth() ||
    (now.getMonth() === dateOfBirth.getMonth() && now.getDate() < dateOfBirth.getDate());
  if (beforeBirthdayThisYear) age -= 1;
  return age >= 0 && age < 130 ? age : null;
}

export function toAddress(a: AddressRecord): Address {
  return {
    id: a._id.toString(),
    label: a.label ?? null,
    name: a.name,
    phone: a.phone,
    line1: a.line1,
    village: a.village ?? null,
    landmark: a.landmark ?? null,
    taluka: a.taluka ?? null,
    district: a.district,
    state: a.state,
    pincode: a.pincode,
    isDefault: a.isDefault,
  };
}

/**
 * Database document -> API shape.
 * This is the single gate that keeps `passwordHash`, `tokenVersion` and `isActive`
 * from ever reaching a client: they are simply not listed below.
 */
export function toCustomer(c: CustomerRecord): Customer {
  return {
    id: c._id.toString(),
    firstName: c.firstName,
    lastName: c.lastName ?? null,
    fullName: [c.firstName, c.lastName].filter(Boolean).join(" "),
    phone: c.phone,
    email: c.email ?? null,
    role: c.role as Role,
    gstin: c.gstin ?? null,
    dateOfBirth: c.dateOfBirth ? c.dateOfBirth.toISOString() : null,
    age: ageFrom(c.dateOfBirth ?? null),
    locale: c.locale as Locale,
    addresses: (c.addresses as AddressRecord[]).map(toAddress),
    createdAt: c.createdAt.toISOString(),
    lastLoginAt: c.lastLoginAt ? c.lastLoginAt.toISOString() : null,
  };
}
