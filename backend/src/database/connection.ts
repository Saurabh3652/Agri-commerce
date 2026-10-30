import mongoose from "mongoose";
import { logger } from "../common/logger";
import { env, isProd } from "../config/env";

export async function connectDatabase() {
  // Build indexes automatically in development; in production create them deliberately.
  mongoose.set("autoIndex", !isProd);
  mongoose.set("strictQuery", true);

  mongoose.connection.on("disconnected", () => logger.warn("MongoDB disconnected"));
  mongoose.connection.on("reconnected", () => logger.info("MongoDB reconnected"));

  await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 10_000 });
  logger.info(`MongoDB connected (${mongoose.connection.name})`);
}

export function disconnectDatabase() {
  mongoose.connection.removeAllListeners("disconnected"); // intentional shutdown, not a warning
  return mongoose.disconnect();
}

export function isDatabaseConnected() {
  return mongoose.connection.readyState === mongoose.ConnectionStates.connected;
}
