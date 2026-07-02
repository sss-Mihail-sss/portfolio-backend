import pgvector from "@prisma-next/extension-pgvector/runtime";
import postgis from "@prisma-next/extension-postgis/runtime";
import postgres from "@prisma-next/postgres/runtime";

import type { Contract } from "./schema.d";

import { env } from "../config/env";
import contractJson from "./schema.json" with { type: "json" };

export const db = postgres<Contract>({
  contractJson,
  extensions: [pgvector, postgis],
  url: env.DATABASE_URL,
});

export type Database = typeof db;
