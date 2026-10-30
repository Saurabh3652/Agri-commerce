import type { AddressInput, Customer, UpdateProfileInput } from "@agri/shared";
import { AppError } from "../../common/errors/app-error";
import { toCustomer } from "./customer.mapper";
import { customerRepository } from "./customer.repository";

/**
 * Every method takes the customerId from the verified session, never from the request body,
 * so one customer can never read or change another's data.
 */
export const customerService = {
  async getProfile(customerId: string): Promise<Customer> {
    const customer = await customerRepository.findById(customerId);
    if (!customer) throw AppError.notFound("Customer");
    return toCustomer(customer);
  },

  async updateProfile(customerId: string, patch: UpdateProfileInput): Promise<Customer> {
    if (patch.gstin !== undefined && patch.gstin !== null) {
      const customer = await customerRepository.findById(customerId);
      if (customer?.role !== "RETAILER") {
        throw AppError.badRequest("Only retailer accounts can add a GSTIN.");
      }
    }
    const updated = await customerRepository.updateProfile(customerId, patch);
    if (!updated) throw AppError.notFound("Customer");
    return toCustomer(updated);
  },

  async addAddress(customerId: string, address: AddressInput): Promise<Customer> {
    const updated = await customerRepository.addAddress(customerId, address);
    if (!updated) throw AppError.notFound("Customer");
    return toCustomer(updated);
  },

  async updateAddress(customerId: string, addressId: string, patch: AddressInput): Promise<Customer> {
    const updated = await customerRepository.updateAddress(customerId, addressId, patch);
    if (!updated) throw AppError.notFound("Address");
    return toCustomer(updated);
  },

  async removeAddress(customerId: string, addressId: string): Promise<Customer> {
    const updated = await customerRepository.removeAddress(customerId, addressId);
    if (!updated) throw AppError.notFound("Address");
    return toCustomer(updated);
  },
};
