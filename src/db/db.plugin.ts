import { Elysia } from "elysia";

import { db } from "./client";

/**
 * Named DB plugin — wraps the Prisma Next postgres client.
 *
 * - `name` ensures Elysia deduplicates it when `.use(dbPlugin)` is called
 *   from multiple feature plugins (the driver/pool is created only once).
 * - `cleanup` (Elysia 2.0 replacement for `onStop`) drains the connection
 *   pool cleanly on server shutdown or hot-reload (`bun --watch`).
 */
export const dbPlugin = new Elysia({ name: "plugin/db" }).decorate("db", db).cleanup(async () => {
  await db.close();
});
