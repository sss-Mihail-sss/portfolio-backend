import { cors } from "@elysia/cors";
import { openapi } from "@elysia/openapi";
import { Elysia, file, t } from "elysia";
import { join, normalize, resolve, sep } from "node:path";

import { env } from "../config/env";
import { errorPlugin } from "../plugins/error.plugin";
import { loggerPlugin } from "../plugins/logger.plugin";
import { router } from "./router";

const PUBLIC_DIR = resolve("public");

export const app = new Elysia()
  .use(loggerPlugin)
  .use(errorPlugin)
  .use(
    cors({
      origin: env.CORS_ORIGIN ?? "http://localhost:3001",
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      credentials: true,
      allowedHeaders: ["Content-Type"],
    }),
  )
  // Hand-rolled static route: neither published @elysia/static build is
  // compatible with elysia 2.0-exp (1.4 imports removed exports, 2.0-exp.0
  // is missing a bundled file).
  .get("/public/*", async ({ params, status }) => {
    const filePath = normalize(join(PUBLIC_DIR, params["*"]));
    const isInsidePublic = filePath.startsWith(PUBLIC_DIR + sep);

    if (!isInsidePublic || !(await Bun.file(filePath).exists())) {
      return status(404, { code: "NOT_FOUND", message: "Not found" });
    }

    return file(filePath);
  })
  .use(openapi())

  // Liveness probe for Docker/K8s and uptime monitors
  .get("/health", { response: { 200: t.Object({ status: t.Literal("ok") }) } }, () => ({
    status: "ok" as const,
  }))

  .use(router);

// End-to-end types for the frontend via Eden Treaty:
//   import { treaty } from "@elysia/eden";
//   const api = treaty<App>("localhost:3000");
export type App = typeof app;
