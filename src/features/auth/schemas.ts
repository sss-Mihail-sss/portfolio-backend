import type { Static } from "typebox";

import { t } from "elysia";

import { ErrorShape } from "../../shared/schemas";

export const AuthSchemas = {
  signUp: {
    body: t.Object({
      email: t.String({ format: "email" }),
      password: t.String({ minLength: 8 }),
      remember: t.Optional(t.Boolean()),
    }),
    response: {
      200: t.Object({ userId: t.String() }),
      409: ErrorShape,
      422: ErrorShape,
      429: ErrorShape,
      500: ErrorShape,
    },
  },

  signIn: {
    body: t.Object({
      email: t.String({ format: "email" }),
      password: t.String(),
      remember: t.Optional(t.Boolean()),
    }),
    response: {
      200: t.Object({ userId: t.String() }),
      401: ErrorShape,
      422: ErrorShape,
      429: ErrorShape,
      500: ErrorShape,
    },
  },

  refresh: {
    // Both cookies optional: the access token is usually already expired
    // when /refresh is called, and a missing refresh token must produce
    // 401 from the command — not a 422 from validation.
    cookie: t.Cookie({
      accessToken: t.Optional(t.String()),
      refreshToken: t.Optional(t.String()),
    }),
    response: {
      200: t.Object({ success: t.Boolean() }),
      401: ErrorShape,
      429: ErrorShape,
    },
  },

  signOut: {
    cookie: t.Cookie({
      accessToken: t.Optional(t.String()),
      refreshToken: t.Optional(t.String()),
    }),
    response: {
      200: t.Object({ success: t.Boolean() }),
    },
  },
} as const;

export type SignUpBody = Static<typeof AuthSchemas.signUp.body>;
export type SignInBody = Static<typeof AuthSchemas.signIn.body>;
