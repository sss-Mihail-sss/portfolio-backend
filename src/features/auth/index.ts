import { Elysia } from "elysia";

import { mailer } from "../../mail/mailer";
import { authPlugin } from "../../plugins/auth.plugin";
import { rateLimitPlugin } from "../../plugins/rate-limit.plugin";
import { userAgentPlugin } from "../../plugins/user-agent.plugin";
import { sendSignUpEmails } from "./auth-emails";
import { refreshTokens } from "./commands/refresh";
import { signIn } from "./commands/sign-in";
import { signOut } from "./commands/sign-out";
import { signUp } from "./commands/sign-up";
import { COOKIE_REFRESH_TOKEN } from "./constants";
import { clearAuthCookies, setAuthCookies } from "./cookies";
import { authReposPlugin } from "./repos.plugin";
import { AuthSchemas } from "./schemas";
import { issueTokenPair } from "./tokens";

export const authFeature = new Elysia({ prefix: "/auth", name: "feature/auth" })
  .use(rateLimitPlugin)
  .use(authPlugin)
  .use(userAgentPlugin)
  .use(authReposPlugin)

  .post(
    "/sign-up",
    {
      rateLimit: { max: 5, window: 60_000 },
      ...AuthSchemas.signUp,
    },
    async ({ identityRepo, sessionRepo, body, accessJwt, refreshJwt, cookie, ip, userAgent }) => {
      const result = await signUp({ identityRepo, sessionRepo }, body, {
        userAgent,
        ip: ip ?? "unknown",
      });
      const tokens = await issueTokenPair(result, { accessJwt, refreshJwt });
      setAuthCookies(cookie, tokens);

      // Fire-and-forget — mail errors must never block the HTTP response.
      void sendSignUpEmails(mailer, { email: body.email, userId: result.userId });

      return { userId: result.userId };
    },
  )

  .post(
    "/sign-in",
    {
      rateLimit: { max: 10, window: 60_000, blockDuration: 300 },
      ...AuthSchemas.signIn,
    },
    async ({ identityRepo, sessionRepo, body, accessJwt, refreshJwt, cookie, ip, userAgent }) => {
      const result = await signIn({ identityRepo, sessionRepo }, body, {
        userAgent,
        ip: ip ?? "unknown",
      });

      const tokens = await issueTokenPair(result, { accessJwt, refreshJwt });
      setAuthCookies(cookie, tokens);
      return { userId: result.userId };
    },
  )

  .post(
    "/refresh",
    {
      rateLimit: { max: 30, window: 60_000 },
      ...AuthSchemas.refresh,
    },
    async ({ sessionRepo, accessJwt, refreshJwt, cookie, ip, userAgent }) => {
      const result = await refreshTokens(
        { sessionRepo },
        { refreshToken: cookie[COOKIE_REFRESH_TOKEN].value, refreshJwt },
        { userAgent, ip: ip ?? "unknown" },
      );
      const tokens = await issueTokenPair(result, { accessJwt, refreshJwt });
      setAuthCookies(cookie, tokens);

      return { success: true };
    },
  )

  .post("/sign-out", AuthSchemas.signOut, async ({ sessionRepo, refreshJwt, cookie }) => {
    await signOut(
      { sessionRepo },
      { refreshToken: cookie[COOKIE_REFRESH_TOKEN].value, refreshJwt },
    );
    clearAuthCookies(cookie);
    return { success: true };
  });
