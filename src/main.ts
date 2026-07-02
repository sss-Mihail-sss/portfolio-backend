import { app } from "./app/app";
import { env } from "./config/env";
import { logger } from "./config/logger";

app.listen({ port: env.PORT });

logger.info(`Running at ${app.server?.hostname}:${app.server?.port}`);

// Docker/K8s stop containers with SIGTERM — app.stop() runs onStop hooks
// (DB pool drain, Redis disconnect) before the process exits.
async function shutdown(signal: string) {
  logger.info(`Received ${signal}, shutting down`);
  await app.stop();
  // oxlint-disable-next-line unicorn/no-process-exit -- intentional: normal exit after graceful stop
  process.exit(0);
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
