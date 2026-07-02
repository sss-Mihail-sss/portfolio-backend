import type { SessionRepo } from "../repos/session.repo";
import type { JwtInstance } from "../tokens";

import { UnauthorizedError } from "../../../shared/errors";
import { SessionExpiredError } from "../errors";
import { getRefreshMaxAge } from "../tokens";

type Deps = { sessionRepo: Pick<SessionRepo, "findById" | "deleteById" | "create"> };
type Meta = { userAgent: string; ip: string };
type Input = { refreshToken: string | undefined; refreshJwt: JwtInstance };
type Output = { userId: string; sessionId: string; remember: boolean };

export async function refreshTokens(deps: Deps, input: Input, meta: Meta): Promise<Output> {
  if (!input.refreshToken) throw new UnauthorizedError("Missing refresh token");

  const payload = await input.refreshJwt.verify(input.refreshToken);
  if (!payload || !payload.sub || !payload.sessionId) {
    throw new UnauthorizedError("Invalid refresh token");
  }

  const userId = payload.sub as string;
  const sessionId = payload.sessionId as string;
  const remember = payload.remember === 1;

  const session = await deps.sessionRepo.findById(sessionId);
  if (!session || session.expiredAt < new Date()) {
    if (session) await deps.sessionRepo.deleteById(sessionId);
    throw new SessionExpiredError();
  }

  await deps.sessionRepo.deleteById(sessionId);

  const newSession = await deps.sessionRepo.create({
    userId,
    userAgent: meta.userAgent,
    ipAddress: meta.ip,
    expiredAt: new Date(Date.now() + getRefreshMaxAge(remember) * 1000),
  });

  return { userId, sessionId: newSession.id, remember };
}
