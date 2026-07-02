import { Elysia } from "elysia";

import { ipPlugin } from "./ip.plugin";
import { redisPlugin } from "../redis/redis.plugin";

export type RateLimitOptions = {
  max: number;
  /** Sliding window in milliseconds */
  window: number;
  /** Block the IP for this many seconds after exceeding the limit */
  blockDuration?: number;
  /** Let requests through when Redis is unavailable (default: true) */
  failOpen?: boolean;
};

const PREFIX = "ratelimit";

// ARGV[4] = unique member per request — prevents ZADD dedup on same-millisecond burst
const SLIDING_WINDOW_LUA = `
local key = KEYS[1]
local now = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local max = tonumber(ARGV[3])
local member = ARGV[4]

redis.call("ZREMRANGEBYSCORE", key, 0, now - window)

local count = redis.call("ZCARD", key)

if count >= max then
    local oldest = redis.call("ZRANGE", key, 0, 0, "WITHSCORES")
    local retry = window
    if oldest[2] ~= nil then
        retry = window - (now - tonumber(oldest[2]))
    end
    return {0, count, retry}
end

redis.call("ZADD", key, now, member)
redis.call("PEXPIRE", key, window)

return {1, count + 1, window}
`;

/**
 * Rate-limit macro — applied per route via `{ rateLimit: { max, window } }`,
 * so limits live next to the routes they protect instead of regex patterns
 * that can drift from the actual paths.
 */
export const rateLimitPlugin = new Elysia({ name: "plugin/rate-limit" })
  .use(redisPlugin) // singleton — no new connection per plugin instance
  .use(ipPlugin)
  .macro({
    rateLimit({ max, window, blockDuration, failOpen = true }: RateLimitOptions) {
      // Pre-compute strings once per route — avoids String() conversion on every request
      const maxStr = String(max);
      const windowStr = String(window);

      return {
        async beforeHandle({ path, set, redis, ip, status }) {
          const clientIp = ip ?? "unknown";
          const blockKey = `${PREFIX}:block:${clientIp}`;

          try {
            const blockTtl = await redis.ttl(blockKey);
            if (blockTtl > 0) {
              set.headers["Retry-After"] = String(blockTtl);
              set.headers["X-RateLimit-Limit"] = maxStr;
              set.headers["X-RateLimit-Remaining"] = "0";
              return status(429, { code: "TOO_MANY_REQUESTS", message: "IP temporarily blocked" });
            }

            const key = `${PREFIX}:${path}:${clientIp}`;
            const now = Date.now();

            const result = await redis.send("EVAL", [
              SLIDING_WINDOW_LUA,
              "1",
              key,
              String(now),
              windowStr,
              maxStr,
              crypto.randomUUID(),
            ]);

            const [allowed, count, retryAfterMs] = result as [number, number, number];

            set.headers["X-RateLimit-Limit"] = maxStr;
            set.headers["X-RateLimit-Remaining"] = String(Math.max(0, max - count));
            set.headers["X-RateLimit-Reset"] = String(Math.floor((now + retryAfterMs) / 1000));

            if (!allowed) {
              set.headers["Retry-After"] = String(Math.ceil(retryAfterMs / 1000));

              if (blockDuration) {
                await redis.set(blockKey, "1", "EX", blockDuration);
              }

              return status(429, { code: "TOO_MANY_REQUESTS", message: "Rate limit exceeded" });
            }
          } catch {
            if (failOpen) return;
            return status(503, {
              code: "SERVICE_UNAVAILABLE",
              message: "Rate limit service unavailable",
            });
          }
        },
      };
    },
  });
