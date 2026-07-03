import { pino, stdSerializers } from "pino";

import { env, isDocker, isProduction, isTest } from "./env";

export const logger = pino({
  // Silent in tests — request/response noise buries actual test output.
  level: isTest ? "silent" : env.LOG_LEVEL || (isProduction ? "info" : "debug"),
  base: { env: env.NODE_ENV },
  timestamp: pino.stdTimeFunctions.isoTime,
  serializers: {
    err: stdSerializers.err,
  },
  redact: {
    paths: [
      "password",
      "token",
      "accessToken",
      "refreshToken",
      "authorization",
      "headers.authorization",
      "cookie",
      "headers.cookie",
    ],
    censor: "[REDACTED]",
  },
  formatters: {
    level: (label) => ({ level: label.toUpperCase() }),
  },
  transport:
    // No pino-pretty in tests either — it spawns a worker thread per run.
    !isProduction && !isDocker && !isTest
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "HH:MM:ss",
            singleLine: false,
            ignore: "pid,hostname",
            messageFormat: "[{req.method}] {req.path} -> {msg}",
          },
        }
      : undefined,
});
