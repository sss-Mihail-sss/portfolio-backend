import { Elysia, t } from "elysia";

import { authPlugin } from "../../plugins/auth.plugin";
import { ErrorShape } from "../../shared/schemas";

export const usersFeature = new Elysia({ prefix: "/users", name: "feature/users" })
  .use(authPlugin)

  .get(
    "/me",
    {
      auth: true,
      response: {
        200: t.Object({ userId: t.String() }),
        401: ErrorShape,
      },
    },
    ({ user }) => ({ userId: user.userId }),
  );
