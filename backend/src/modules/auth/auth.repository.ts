// Repository = the only place that queries MongoDB for sessions.
import { SessionModel, type SessionRecord } from "./models/session.model";

export const authRepository = {
  createSession(data: {
    customerId: string;
    tokenHash: string;
    familyId: string;
    expiresAt: Date;
    userAgent: string | null;
    ip: string | null;
  }) {
    return SessionModel.create(data);
  },

  findSessionByHash(tokenHash: string) {
    return SessionModel.findOne({ tokenHash }).lean<SessionRecord>();
  },

  /** Marks a session as rotated and records which token replaced it. */
  rotateSession(tokenHash: string, replacedBy: string) {
    return SessionModel.updateOne(
      { tokenHash },
      { $set: { replacedBy, revokedAt: new Date(), revokedReason: "rotated", lastUsedAt: new Date() } },
    );
  },

  revokeSession(tokenHash: string, reason: string) {
    return SessionModel.updateOne(
      { tokenHash, revokedAt: null },
      { $set: { revokedAt: new Date(), revokedReason: reason } },
    );
  },

  /** Used on refresh-token reuse: kills every session descended from the same login. */
  revokeFamily(familyId: string, reason: string) {
    return SessionModel.updateMany(
      { familyId, revokedAt: null },
      { $set: { revokedAt: new Date(), revokedReason: reason } },
    );
  },

  revokeAllForCustomer(customerId: string, reason: string) {
    return SessionModel.updateMany(
      { customerId, revokedAt: null },
      { $set: { revokedAt: new Date(), revokedReason: reason } },
    );
  },
};
