import { RedisClient } from "bun";

import { env } from "../config/env";

// Singleton — one connection for the whole app lifetime
export const redis = new RedisClient(env.REDIS_URL);