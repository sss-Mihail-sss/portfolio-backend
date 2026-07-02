import { Elysia } from "elysia";

import { s3 } from "./client";

/**
 * Named S3 plugin — Elysia facade over the singleton client.
 *
 * No `cleanup`: S3Client keeps no persistent connection, there is
 * nothing to close on shutdown.
 */
export const s3Plugin = new Elysia({ name: "plugin/s3" }).decorate("s3", s3);