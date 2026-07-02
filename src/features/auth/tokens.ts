import { REFRESH_TOKEN_MAX_AGE_LONG, REFRESH_TOKEN_MAX_AGE_SHORT } from "./constants";

// Claims this app puts into its tokens. The structural type below matches
// the @elysia/jwt instance, so commands stay decoupled from the plugin.
export type TokenClaims = { sub: string; sessionId: string; remember?: number };

export type JwtInstance = {
  sign(payload: TokenClaims): Promise<string>;
  verify(token?: string): Promise<false | Record<string, unknown>>;
};

export function getRefreshMaxAge(remember: boolean): number {
  return remember ? REFRESH_TOKEN_MAX_AGE_LONG : REFRESH_TOKEN_MAX_AGE_SHORT;
}

export async function issueTokenPair(
  payload: { userId: string; sessionId: string; remember: boolean },
  jwt: { accessJwt: JwtInstance; refreshJwt: JwtInstance },
): Promise<{ accessToken: string; refreshToken: string; refreshMaxAge: number }> {
  const refreshMaxAge = getRefreshMaxAge(payload.remember);

  const [accessToken, refreshToken] = await Promise.all([
    jwt.accessJwt.sign({ sub: payload.userId, sessionId: payload.sessionId }),
    jwt.refreshJwt.sign({
      sub: payload.userId,
      sessionId: payload.sessionId,
      remember: payload.remember ? 1 : 0,
    }),
  ]);

  return { accessToken, refreshToken, refreshMaxAge };
}
