import { SUPPORTED_LOCALES } from "@agri/shared";
import { Schema, model, type InferSchemaType, type Types } from "mongoose";

/** Brand, theme colours, contact details and header/footer text. One document per locale. */
const siteSettingsSchema = new Schema(
  {
    locale: { type: String, enum: SUPPORTED_LOCALES, required: true, unique: true },
    siteName: { type: String, required: true },
    tagline: { type: String, default: null },
    logoUrl: { type: String, default: null },
    theme: {
      primaryColor: { type: String, required: true },
      primaryDarkColor: { type: String, required: true },
      accentColor: { type: String, required: true },
    },
    contact: {
      phone: { type: String, default: null },
      whatsapp: { type: String, default: null },
      email: { type: String, default: null },
      hours: { type: String, default: null },
    },
    header: {
      showSearch: { type: Boolean, default: true },
      searchPlaceholder: { type: String, default: "Search products" },
    },
    footer: {
      about: { type: String, default: null },
      copyright: { type: String, required: true },
    },
    seo: {
      title: { type: String, required: true },
      description: { type: String, required: true },
    },
  },
  { timestamps: true, collection: "site_settings" },
);

export type SiteSettingsRecord = InferSchemaType<typeof siteSettingsSchema> & { _id: Types.ObjectId };
export const SiteSettingsModel = model("SiteSettings", siteSettingsSchema);
