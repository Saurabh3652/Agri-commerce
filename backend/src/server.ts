import { createApp } from "./app";
import { logger } from "./common/logger";
import { env } from "./config/env";
import { connectDatabase, disconnectDatabase } from "./database/connection";

async function main() {
  await connectDatabase();

  const server = createApp().listen(env.PORT, () => {
    logger.info(`API listening on http://localhost:${env.PORT}/api/v1`);
  });

  const shutdown = (signal: string) => {
    logger.info(`${signal} received, shutting down`);
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
  };
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

main().catch((err) => {
  logger.fatal({ err }, "Failed to start API");
  process.exit(1);
});
