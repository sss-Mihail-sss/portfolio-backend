import type { SessionRepo } from "../repos/session.repo";
import type { JwtInstance } from "../tokens";

type Deps = { sessionRepo: Pick<SessionRepo, "deleteById"> };
type Input = { refreshToken: string | undefined; refreshJwt: JwtInstance };

export async function signOut(deps: Deps, input: Input): Promise<void> {
  if (!input.refreshToken) {
    return;
  }

  const payload = await input.refreshJwt.verify(input.refreshToken);
  if (payload && payload.sessionId) {
    await deps.sessionRepo.deleteById(payload.sessionId as string).catch(() => {});
  }
}
