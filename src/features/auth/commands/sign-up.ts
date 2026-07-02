import type { IdentityRepo } from "../repos/identity.repo";
import type { SessionRepo } from "../repos/session.repo";

import { EmailAlreadyTakenError } from "../errors";
import { type SignUpBody } from "../schemas";
import { getRefreshMaxAge } from "../tokens";

type Deps = {
  identityRepo: Pick<IdentityRepo, "existsByEmail" | "createWithUser">;
  sessionRepo: Pick<SessionRepo, "create">;
};
type Meta = { userAgent: string; ip: string };
type Output = { userId: string; sessionId: string; remember: boolean };

export async function signUp(deps: Deps, input: SignUpBody, meta: Meta): Promise<Output> {
  const exists = await deps.identityRepo.existsByEmail(input.email);

  if (exists) {
    throw new EmailAlreadyTakenError();
  }

  const { userId } = await deps.identityRepo.createWithUser(input.email, input.password);

  const remember = input.remember ?? false;
  const session = await deps.sessionRepo.create({
    userId,
    userAgent: meta.userAgent,
    ipAddress: meta.ip,
    expiredAt: new Date(Date.now() + getRefreshMaxAge(remember) * 1000),
  });

  return {
    userId,
    sessionId: session.id,
    remember,
  };
}
