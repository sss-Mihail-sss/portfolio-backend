import { Elysia } from "elysia";

import { logger } from "../config/logger";
import { redis } from "./client";

/**
 * Named Redis plugin — Elysia facade over the singleton client.
 *
 * - `name` ensures deduplication when multiple plugins `.use()` it.
 * - `cleanup` closes the connection on server shutdown or hot-reload.
 */
export const redisPlugin = new Elysia({ name: "plugin/redis" })
  .decorate("redis", redis)
  .cleanup(() => {
    redis.close();
    logger.info("[redis] disconnected");
  });