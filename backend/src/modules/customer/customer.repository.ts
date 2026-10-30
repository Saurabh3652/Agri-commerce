// Repository = the only place that queries MongoDB for customers.
import type { AddressInput, SignupRole, UpdateProfileInput } from "@agri/shared";
import { CustomerModel, type CustomerRecord } from "./customer.model";

export const customerRepository = {
  findById(id: string) {
    return CustomerModel.findById(id).lean<CustomerRecord>();
  },

  findByPhone(phone: string) {
    return CustomerModel.findOne({ phone }).lean<CustomerRecord>();
  },

  /** Explicitly includes passwordHash; used only by the admin password login. */
  findByPhoneWithPassword(phone: string) {
    return CustomerModel.findOne({ phone }).select("+passwordHash").lean<CustomerRecord>();
  },

  create(data: { phone: string; firstName: string; lastName?: string; role: SignupRole }) {
    return CustomerModel.create(data);
  },

  markLoggedIn(id: string) {
    return CustomerModel.updateOne({ _id: id }, { $set: { lastLoginAt: new Date() } });
  },

  async updateProfile(id: string, patch: UpdateProfileInput) {
    const doc = await CustomerModel.findById(id);
    if (!doc) return null;
    // Assigning only the provided keys keeps PATCH semantics (absent key = unchanged).
    doc.set(patch);
    await doc.save();
    return doc.toObject() as CustomerRecord;
  },

  async addAddress(id: string, address: AddressInput) {
    const doc = await CustomerModel.findById(id);
    if (!doc) return null;
    doc.addresses.push(address);
    await doc.save(); // the pre-save hook keeps exactly one default
    return doc.toObject() as CustomerRecord;
  },

  async updateAddress(id: string, addressId: string, patch: AddressInput) {
    const doc = await CustomerModel.findById(id);
    const address = doc?.addresses.id(addressId);
    if (!doc || !address) return null;
    address.set(patch);
    await doc.save();
    return doc.toObject() as CustomerRecord;
  },

  async removeAddress(id: string, addressId: string) {
    const doc = await CustomerModel.findById(id);
    const address = doc?.addresses.id(addressId);
    if (!doc || !address) return null;
    address.deleteOne();
    await doc.save();
    return doc.toObject() as CustomerRecord;
  },
};
