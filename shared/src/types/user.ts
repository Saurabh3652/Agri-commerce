import type { Locale, Role } from "../constants";
import type { ISODateString } from "./common";

export type Address = {
  id: string;
  label: string | null; // "Home", "Farm", "Shop"
  name: string;
  phone: string;
  line1: string;
  village: string | null;
  landmark: string | null;
  taluka: string | null;
  district: string;
  state: string;
  pincode: string;
  isDefault: boolean;
};

/** The signed-in user. `passwordHash` never appears here — the mapper strips it. */
export type Customer = {
  id: string;
  firstName: string;
  lastName: string | null;
  fullName: string;
  phone: string;
  email: string | null;
  role: Role;
  gstin: string | null;
  dateOfBirth: ISODateString | null;
  /** Worked out from dateOfBirth at read time, so it can never go stale. */
  age: number | null;
  locale: Locale;
  addresses: Address[];
  createdAt: ISODateString;
  lastLoginAt: ISODateString | null;
};

/** Returned by GET /auth/me. */
export type Session = { customer: Customer };

/** Returned by POST /auth/otp/request. */
export type OtpRequestResult = {
  /** Always true, even for an unknown phone, so the API can't be used to discover customers. */
  sent: boolean;
  /** Whether this phone already has an account, so the UI knows to ask for a name. */
  isNewUser: boolean;
  expiresInSeconds: number;
  resendAfterSeconds: number;
  /** Development only: the code, so you can test without SMS. Never set in production. */
  devOtp?: string;
};

export type LoginResult = {
  customer: Customer;
  isNewUser: boolean;
};
