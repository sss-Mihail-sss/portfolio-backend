import { Type } from "typebox";
import { Value } from "typebox/value";

const envSchema = Type.Object({
  PORT: Type.Number(),
  NODE_ENV: Type.Enum(["test", "development", "production"]),

  DOCKER: Type.Boolean(),
  KUBERNETES_SERVICE_HOST: Type.Optional(Type.String()),

  LOG_LEVEL: Type.Enum(["fatal", "error", "warn", "info", "debug", "trace"]),

  CORS_ORIGIN: Type.Optional(Type.String()),

  // JWT
  ACCESS_JWT_SECRET: Type.String(),
  REFRESH_JWT_SECRET: Type.String(),

  // Redis
  REDIS_URL: Type.String(),

  // Database
  DATABASE_URL: Type.String(),

  // S3
  S3_ACCESS_KEY: Type.String(),
  S3_SECRET_KEY: Type.String(),
  S3_ENDPOINT: Type.Optional(Type.String()),
  S3_BUCKET: Type.Optional(Type.String()),
  S3_REGION: Type.Optional(Type.String()),

  RESEND_API_KEY: Type.String(),
  EMAIL_FROM: Type.String(),
  FRONTEND_URL: Type.String(),
});

// process.env values are all strings — Convert coerces "3000"/"true" into
// the schema's number/boolean types before the strict Parse check.
// oxlint-disable-next-line node/no-process-env
export const env = Value.Parse(envSchema, Value.Convert(envSchema, { ...process.env }));

export const isProduction = env.NODE_ENV === "production";
export const isDocker = env.DOCKER || env.KUBERNETES_SERVICE_HOST !== undefined;
