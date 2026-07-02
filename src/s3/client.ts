import { S3Client } from "bun";

import { env } from "../config/env";

// Singleton — S3Client is stateless (plain HTTP per operation), one instance
// is enough for the whole app. Without S3_ENDPOINT it targets AWS S3.
export const s3 = new S3Client({
  accessKeyId: env.S3_ACCESS_KEY,
  secretAccessKey: env.S3_SECRET_KEY,
  endpoint: env.S3_ENDPOINT,
  bucket: env.S3_BUCKET,
  region: env.S3_REGION,
});