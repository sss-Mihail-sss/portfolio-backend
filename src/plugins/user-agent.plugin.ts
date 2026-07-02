import { Elysia } from "elysia";

// "global" — without a scope the derived value would stay local to this
// instance and never reach the features that .use() the plugin.
export const userAgentPlugin = new Elysia({ name: "plugin/user-agent" }).derive(
  "global",
  ({ request }) => ({
    userAgent: request.headers.get("user-agent") ?? "",
  }),
);
