import mongoose, { type ClientSession } from "mongoose";

/**
 * Runs `work` as one all-or-nothing unit. If anything throws, every write inside is undone,
 * so stock is never taken without an order being created (or the other way round).
 */
export async function withTransaction<T>(work: (session: ClientSession) => Promise<T>): Promise<T> {
  const session = await mongoose.startSession();
  try {
    let result!: T;
    await session.withTransaction(async () => {
      result = await work(session);
    });
    return result;
  } finally {
    await session.endSession();
  }
}
