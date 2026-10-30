import type { DeliveryAreaInput, StoreConfig } from "@agri/shared";
import { DeliveryAreaModel, StoreConfigModel, type DeliveryAreaRecord, type StoreConfigRecord } from "./store.model";

const CONFIG_ID = "default";

export const storeRepository = {
  /** Returns the config, creating it from the schema defaults the first time. */
  getConfig() {
    return StoreConfigModel.findOneAndUpdate(
      { _id: CONFIG_ID },
      {},
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
    ).lean<StoreConfigRecord>();
  },

  updateConfig(config: StoreConfig) {
    return StoreConfigModel.findOneAndUpdate({ _id: CONFIG_ID }, { $set: config }, { upsert: true, returnDocument: "after" }).lean<
      StoreConfigRecord
    >();
  },

  findActiveArea(pincode: string) {
    return DeliveryAreaModel.findOne({ _id: pincode, isActive: true }).lean<DeliveryAreaRecord>();
  },

  listAreas() {
    return DeliveryAreaModel.find().sort({ district: 1, _id: 1 }).lean<DeliveryAreaRecord[]>();
  },

  upsertArea(pincode: string, area: DeliveryAreaInput) {
    return DeliveryAreaModel.findOneAndUpdate({ _id: pincode }, { $set: area }, { upsert: true, returnDocument: "after" }).lean<
      DeliveryAreaRecord
    >();
  },

  deleteArea(pincode: string) {
    return DeliveryAreaModel.deleteOne({ _id: pincode });
  },
};
