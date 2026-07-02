import { jwt } from "@elysia/jwt";
import { Elysia, t } from "elysia";

import { env } from "../config/env";
import { COOKIE_ACCESS_TOKEN, COOKIE_REFRESH_TOKEN } from "../features/auth/constants";
import { UnauthorizedError } from "../shared/errors";

export const cookieSchema = t.Cookie({
  [COOKIE_ACCESS_TOKEN]: t.Optional(t.String()),
  [COOKIE_REFRESH_TOKEN]: t.Optional(t.String()),
});

/**
 * Auth plugin — JWT instances + `auth` macro.
 *
 * Routes opt in with `{ auth: true }`: unauthenticated requests get 401
 * before the handler runs, and the handler receives a non-nullable `user`
 * (no `!` assertions needed).
 */
export const authPlugin = new Elysia({ name: "plugin/auth" })
  .use(jwt({ name: "accessJwt", secret: env.ACCESS_JWT_SECRET, exp: "5m" }))
  .use(jwt({ name: "refreshJwt", secret: env.REFRESH_JWT_SECRET }))
  .guard({ as: "plugin", cookie: cookieSchema })
  .macro({
    auth: {
      // In Elysia 2.0 the macro's `derive` contributes to handler context —
      // routes with `auth: true` receive a non-nullable `user`.
      async derive({ accessJwt, cookie }) {
        const token = cookie[COOKIE_ACCESS_TOKEN].value;
        if (!token) {
          throw new UnauthorizedError();
        }

        const payload = await accessJwt.verify(token);
        if (!payload || !payload.sub) {
          throw new UnauthorizedError();
        }

        return {
          user: {
            userId: payload.sub,
            sessionId: payload.sessionId as string,
          },
        };
      },
    },
  });
