import { Elysia } from "elysia";

import { logger as rootLogger } from "../config/logger";
import { AppError } from "../shared/errors";
import { ipPlugin } from "./ip.plugin";
import { userAgentPlugin } from "./user-agent.plugin";

const SKIP_PATHS = new Set(["/health", "/ping"]);

// Error hooks don't see per-request derived state, so failures are parked
// here (keyed by request) and picked up in afterResponse for the final log line.
const requestErrors = new WeakMap<Request, unknown>();

export const loggerPlugin = new Elysia({ name: "plugin/logger" })
  .use(ipPlugin)
  .use(userAgentPlugin)
  .decorate("logger", rootLogger)
  .derive("global", ({ logger, ip, userAgent }) => {
    const requestId = crypto.randomUUID();
    return {
      requestId,
      startedAt: performance.now(),
      log: logger.child({ requestId, ip, userAgent }),
    };
  })
  .beforeHandle("global", ({ set, requestId }) => {
    set.headers["x-request-id"] = requestId;
  })
  .error("global", ({ request, error }) => {
    requestErrors.set(request, error);
  })
  .afterResponse("global", ({ request, path, startedAt, set, log }) => {
    // `derive` never runs for unmatched routes (404), so `log` can be
    // undefined here despite the types saying otherwise.
    if (!log || request.method === "OPTIONS" || SKIP_PATHS.has(path)) return;

    const duration = Math.round(performance.now() - startedAt);
    const req = { method: request.method, path };
    const res = { status: set.status ?? 200, duration };

    const error = requestErrors.get(request);
    if (error === undefined) {
      log.info({ req, res }, "←");
    } else {
      requestErrors.delete(request);
      const isClientError = error instanceof AppError && error.status < 500;
      log[isClientError ? "warn" : "error"]({ req, res, err: error }, "✕");
    }
  });
