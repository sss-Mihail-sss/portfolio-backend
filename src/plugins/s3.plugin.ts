import { S3Client } from "bun";
import { Elysia } from "elysia";

import { env } from "../config/env";
import { logger } from "../config/logger";

// Singleton — one connection for the whole app lifetime
const s3 = new S3Client({
  accessKeyId: env.S3_ACCESS_KEY,
  secretAccessKey: env.S3_SECRET_KEY,
});

export const s3Plugin = new Elysia({ name: "plugin/s3" }).decorate("s3", s3).cleanup(() => {
  // s3.close();
  logger.info("[s3] disconnected");
});
