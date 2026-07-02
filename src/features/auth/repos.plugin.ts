import { Elysia } from "elysia";

import { db } from "../../db/client";
import { dbPlugin } from "../../db/db.plugin";
import { IdentityRepo } from "./repos/identity.repo";
import { SessionRepo } from "./repos/session.repo";

/**
 * Named auth-repos plugin.
 *
 * - Depends on `dbPlugin` so the DB lifecycle (connect/close) is always
 *   registered — even if `dbPlugin` was already `.use()`-d elsewhere,
 *   Elysia deduplicates by name.
 * - Repos are stateless classes: `decorate` (not `derive`) creates them
 *   once at startup and shares them across all requests.
 */
export const authReposPlugin = new Elysia({ name: "plugin/auth-repos" })
  .use(dbPlugin)
  .decorate("identityRepo", new IdentityRepo(db))
  .decorate("sessionRepo", new SessionRepo(db));
