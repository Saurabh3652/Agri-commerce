import type { DeliveryAreaInput } from "../schemas/store.schema";

export type DeliveryArea = DeliveryAreaInput & { pincode: string };

/** Answer to "do you deliver to my pincode?". */
export type DeliveryCheck = {
  pincode: string;
  serviceable: boolean;
  district: string | null;
  deliveryFeePaise: number;
  etaDays: number | null;
  codAvailable: boolean;
};
