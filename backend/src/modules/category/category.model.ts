import { Schema, model, type InferSchemaType, type Types } from "mongoose";

const categorySchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    icon: { type: String, default: null },
    imageUrl: { type: String, default: null },
    parentId: { type: Schema.Types.ObjectId, ref: "Category", default: null },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    
    translations: {
      type: Map,
      of: new Schema({ name: { type: String, required: true } }, { _id: false }),
      default: {},
    },
  },
  { timestamps: true, collection: "categories" },
);

categorySchema.index({ isActive: 1, sortOrder: 1 });

export type CategoryRecord = InferSchemaType<typeof categorySchema> & { _id: Types.ObjectId };
export const CategoryModel = model("Category", categorySchema);
