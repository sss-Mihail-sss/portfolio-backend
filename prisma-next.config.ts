import postgresAdapter from "@prisma-next/adapter-postgres/control";
import { defineConfig } from "@prisma-next/cli/config-types";
import postgresDriver from "@prisma-next/driver-postgres/control";
import pgvector from "@prisma-next/extension-pgvector/control";
import postgis from "@prisma-next/extension-postgis/control";
import sql from "@prisma-next/family-sql/control";
import { typescriptContract } from "@prisma-next/sql-contract-ts/config-types";
import postgres from "@prisma-next/target-postgres/control";

import { env } from "./src/config/env";
import { contract } from "./src/db/schema";

export default defineConfig({
  family: sql,
  target: postgres,
  driver: postgresDriver,
  adapter: postgresAdapter,
  extensionPacks: [pgvector, postgis],
  contract: typescriptContract(contract, "src/db/schema.json"),
  db: {
    connection: env.DATABASE_URL,
  },
});
