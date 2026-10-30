import { ICON_NAMES, NAVIGATION_KEYS, SUPPORTED_LOCALES } from "@agri/shared";
import { Schema, model, type InferSchemaType, type Types } from "mongoose";

const linkSchema = new Schema(
  {
    label: { type: String, required: true },
    href: { type: String, required: true },
  },
  { _id: false },
);

const navItemSchema = new Schema(
  {
    label: { type: String, required: true },
    href: { type: String, required: true },
    icon: { type: String, enum: [...ICON_NAMES, null], default: null },
    isActive: { type: Boolean, default: true },
    children: { type: [linkSchema], default: [] },
  },
  { _id: false },
);

/** A menu (header, footer…). Item order in the array is display order. */
const navigationSchema = new Schema(
  {
    key: { type: String, enum: NAVIGATION_KEYS, required: true },
    locale: { type: String, enum: SUPPORTED_LOCALES, required: true },
    items: { type: [navItemSchema], default: [] },
  },
  { timestamps: true, collection: "navigations" },
);

navigationSchema.index({ key: 1, locale: 1 }, { unique: true });

export type NavigationRecord = InferSchemaType<typeof navigationSchema> & { _id: Types.ObjectId };
export const NavigationModel = model("Navigation", navigationSchema);
