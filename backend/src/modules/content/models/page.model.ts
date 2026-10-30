import { SECTION_TYPES, SUPPORTED_LOCALES } from "@agri/shared";
import { Schema, model, type InferSchemaType, type Types } from "mongoose";

/**
 * One block on a page (hero, product grid…). `data` is flexible here and validated per
 * section type by the zod schemas in @agri/shared when the page is read.
 */
const sectionSchema = new Schema({
  type: { type: String, enum: SECTION_TYPES, required: true },
  isActive: { type: Boolean, default: true },
  data: { type: Schema.Types.Mixed, default: {} },
});

/** A page built from sections. Section order in the array is display order. */
const pageSchema = new Schema(
  {
    slug: { type: String, required: true, lowercase: true, trim: true }, // "home"
    locale: { type: String, enum: SUPPORTED_LOCALES, required: true },
    title: { type: String, required: true },
    isPublished: { type: Boolean, default: true },
    seo: {
      title: { type: String, default: null },
      description: { type: String, default: null },
    },
    sections: { type: [sectionSchema], default: [] },
  },
  { timestamps: true, collection: "pages" },
);

pageSchema.index({ slug: 1, locale: 1 }, { unique: true });

export type PageRecord = InferSchemaType<typeof pageSchema> & { _id: Types.ObjectId };
export type SectionRecord = PageRecord["sections"][number] & { _id: Types.ObjectId };
export const PageModel = model("Page", pageSchema);
