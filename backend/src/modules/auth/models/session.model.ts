import { Schema, model, type InferSchemaType, type Types } from "mongoose";

/**
 * One row per logged-in device, holding the refresh token.
 *  - `tokenHash` only: the raw token exists solely in the user's cookie.
 *  - Rotated on every refresh, so a stolen token works at most once.
 *  - `replacedBy` + `revokedAt` give theft detection: if an already-rotated token is presented,
 *    the whole family is revoked, because two parties clearly hold the same token.
 *  - TTL index on `expiresAt` cleans up old sessions automatically.
 */
const sessionSchema = new Schema(
  {
    customerId: { type: Schema.Types.ObjectId, ref: "Customer", required: true },
    tokenHash: { type: String, required: true, unique: true },
    /** Links rotations together so an entire chain can be revoked at once. */
    familyId: { type: String, required: true },
    replacedBy: { type: String, default: null },
    revokedAt: { type: Date, default: null },
    revokedReason: { type: String, default: null },
    userAgent: { type: String, default: null },
    ip: { type: String, default: null },
    lastUsedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { collection: "sessions" },
);

sessionSchema.index({ customerId: 1, createdAt: -1 });
sessionSchema.index({ familyId: 1 });
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type SessionRecord = InferSchemaType<typeof sessionSchema> & { _id: Types.ObjectId };
export const SessionModel = model("Session", sessionSchema);
