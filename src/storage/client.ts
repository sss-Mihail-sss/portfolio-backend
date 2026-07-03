import { S3Client } from "bun";

import { env } from "../config/env";

// Singleton — S3Client is stateless (plain HTTP per operation), one instance
// is enough for the whole app. The env vars keep the S3_ prefix because S3
// is the wire protocol, not the provider: without S3_ENDPOINT this targets
// AWS, with it — any S3-compatible storage (Cloudflare R2, MinIO, ...).
export const storage = new S3Client({
  accessKeyId: env.S3_ACCESS_KEY,
  secretAccessKey: env.S3_SECRET_KEY,
  endpoint: env.S3_ENDPOINT,
  bucket: env.S3_BUCKET,
  region: env.S3_REGION,
});