import type { Context } from "elysia";

import { isProduction } from "../../config/env";
import { ACCESS_TOKEN_MAX_AGE, COOKIE_ACCESS_TOKEN, COOKIE_REFRESH_TOKEN } from "./constants";

const DEFAULTS = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "strict" as const,
  path: "/",
};

export function setAuthCookies(
  cookie: Context["cookie"],
  tokens: { accessToken: string; refreshToken: string; refreshMaxAge: number },
) {
  cookie[COOKIE_ACCESS_TOKEN].set({
    ...DEFAULTS,
    value: tokens.accessToken,
    maxAge: ACCESS_TOKEN_MAX_AGE,
  });
  cookie[COOKIE_REFRESH_TOKEN].set({
    ...DEFAULTS,
    value: tokens.refreshToken,
    maxAge: tokens.refreshMaxAge,
  });
}

export function clearAuthCookies(cookie: Context["cookie"]) {
  cookie[COOKIE_ACCESS_TOKEN].remove();
  cookie[COOKIE_REFRESH_TOKEN].remove();
}
