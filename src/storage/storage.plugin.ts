import { Elysia } from "elysia";

import { storage } from "./client";

/**
 * Named object-storage plugin — Elysia facade over the singleton client.
 *
 * No `cleanup`: the client keeps no persistent connection, there is
 * nothing to close on shutdown.
 */
export const storagePlugin = new Elysia({ name: "plugin/storage" }).decorate("storage", storage);