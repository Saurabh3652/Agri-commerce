import type { DeliveryArea, DeliveryAreaInput, DeliveryCheck, StoreConfig } from "@agri/shared";
import type { DeliveryAreaRecord, StoreConfigRecord } from "./store.model";
import { storeRepository } from "./store.repository";

function toStoreConfig(c: StoreConfigRecord): StoreConfig {
  return {
    codEnabled: c.codEnabled,
    codMaxOrderPaise: c.codMaxOrderPaise,
    minOrderPaise: c.minOrderPaise,
    freeDeliveryAbovePaise: c.freeDeliveryAbovePaise,
    maxQuantityPerItem: c.maxQuantityPerItem,
    lowStockThreshold: c.lowStockThreshold,
    orderNumberPrefix: c.orderNumberPrefix,
    timezone: c.timezone,
  };
}

function toDeliveryArea(a: DeliveryAreaRecord): DeliveryArea {
  return {
    pincode: a._id,
    district: a.district,
    deliveryFeePaise: a.deliveryFeePaise,
    etaDays: a.etaDays,
    codAvailable: a.codAvailable,
    isActive: a.isActive,
  };
}

export const storeService = {
  async getConfig(): Promise<StoreConfig> {
    return toStoreConfig((await storeRepository.getConfig())!);
  },

  async updateConfig(config: StoreConfig): Promise<StoreConfig> {
    return toStoreConfig((await storeRepository.updateConfig(config))!);
  },

  /** Delivery fee and options for a pincode. The fee is waived above the free-delivery amount. */
  async checkDelivery(pincode: string, subtotalPaise = 0): Promise<DeliveryCheck> {
    const [area, config] = await Promise.all([storeRepository.findActiveArea(pincode), this.getConfig()]);
    if (!area) {
      return { pincode, serviceable: false, district: null, deliveryFeePaise: 0, etaDays: null, codAvailable: false };
    }
    const isFree = config.freeDeliveryAbovePaise > 0 && subtotalPaise >= config.freeDeliveryAbovePaise;
    return {
      pincode,
      serviceable: true,
      district: area.district,
      deliveryFeePaise: isFree ? 0 : area.deliveryFeePaise,
      etaDays: area.etaDays,
      codAvailable: config.codEnabled && area.codAvailable,
    };
  },

  async listAreas(): Promise<DeliveryArea[]> {
    return (await storeRepository.listAreas()).map(toDeliveryArea);
  },

  async saveArea(pincode: string, area: DeliveryAreaInput): Promise<DeliveryArea> {
    return toDeliveryArea((await storeRepository.upsertArea(pincode, area))!);
  },

  async deleteArea(pincode: string): Promise<void> {
    await storeRepository.deleteArea(pincode);
  },
};
