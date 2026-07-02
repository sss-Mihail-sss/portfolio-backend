import type { IdentityRepo } from "../repos/identity.repo";
import type { SessionRepo } from "../repos/session.repo";

import { verifyPassword } from "../../../shared/crypto";
import { InvalidCredentialsError } from "../errors";
import { type SignInBody } from "../schemas";
import { getRefreshMaxAge } from "../tokens";

// Pick — commands depend only on the methods they call, so tests can
// pass plain-object fakes without casting.
type Deps = {
  identityRepo: Pick<IdentityRepo, "findByEmail">;
  sessionRepo: Pick<SessionRepo, "create">;
};
type Meta = { userAgent: string; ip: string };
type Output = { userId: string; sessionId: string; remember: boolean };

export async function signIn(deps: Deps, input: SignInBody, meta: Meta): Promise<Output> {
  const identity = await deps.identityRepo.findByEmail(input.email);
  if (!identity?.credential) {
    throw new InvalidCredentialsError();
  }

  const valid = await verifyPassword(input.password, identity.credential);
  if (!valid) {
    throw new InvalidCredentialsError();
  }

  const remember = input.remember ?? false;
  const session = await deps.sessionRepo.create({
    userId: identity.userId,
    userAgent: meta.userAgent,
    ipAddress: meta.ip,
    expiredAt: new Date(Date.now() + getRefreshMaxAge(remember) * 1000),
  });

  return { userId: identity.userId, sessionId: session.id, remember };
}
