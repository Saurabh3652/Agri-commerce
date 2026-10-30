import { ROLES, SUPPORTED_LOCALES } from "@agri/shared";
import { Schema, model, type InferSchemaType, type Types } from "mongoose";

/** Addresses live inside the customer document: there are only a few and they are always read together. */
const addressSchema = new Schema({
  label: { type: String, default: null }, // "Home", "Farm", "Shop"
  name: { type: String, required: true },
  phone: { type: String, required: true },
  line1: { type: String, required: true },
  village: { type: String, default: null },
  landmark: { type: String, default: null },
  taluka: { type: String, default: null },
  district: { type: String, required: true },
  state: { type: String, default: "Gujarat" },
  pincode: { type: String, required: true, match: /^[1-9]\d{5}$/ },
  isDefault: { type: Boolean, default: false },
});

const customerSchema = new Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, default: null, trim: true },
    phone: { type: String, required: true, unique: true, match: /^[6-9]\d{9}$/ },
    email: { type: String, default: null, lowercase: true, trim: true },

    // select: false keeps the hash out of every query result unless explicitly asked for.
    // Only ADMIN accounts have one; customers log in with OTP.
    passwordHash: { type: String, default: null, select: false },

    role: { type: String, enum: ROLES, default: "CUSTOMER", required: true },
    gstin: { type: String, default: null }, // retailers only

    // Stored instead of age, which would silently go stale every year.
    dateOfBirth: { type: Date, default: null },

    locale: { type: String, enum: SUPPORTED_LOCALES, default: "en" },
    addresses: { type: [addressSchema], default: [] },

    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date, default: null },

    // Bumping this invalidates every existing session for this customer at once
    // (used by "log out everywhere", and automatically when an account is disabled).
    tokenVersion: { type: Number, default: 0 },
  },
  { timestamps: true, collection: "customers" },
);

// Unique only when an email is actually present, since most customers sign up with a phone only.
customerSchema.index({ email: 1 }, { unique: true, partialFilterExpression: { email: { $type: "string" } } });
customerSchema.index({ role: 1 });

/** Keeps exactly one address flagged as default. */
customerSchema.pre("save", function () {
  if (this.addresses.length === 0) return;
  const chosen = this.addresses.filter((a) => a.isDefault);
  if (chosen.length === 1) return;
  // None marked (or several): keep the last marked one, else fall back to the first address.
  const keep = chosen.at(-1) ?? this.addresses[0];
  this.addresses.forEach((a) => {
    a.isDefault = a === keep;
  });
});

export type CustomerRecord = InferSchemaType<typeof customerSchema> & { _id: Types.ObjectId };
export type AddressRecord = CustomerRecord["addresses"][number] & { _id: Types.ObjectId };
export const CustomerModel = model("Customer", customerSchema);
