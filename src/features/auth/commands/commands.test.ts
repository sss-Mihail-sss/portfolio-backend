import { describe, expect, it } from "bun:test";

import type { IdentityRow } from "../repos/identity.repo";
import type { SessionRow } from "../repos/session.repo";
import type { JwtInstance } from "../tokens";

import { hashPassword } from "../../../shared/crypto";
import { UnauthorizedError } from "../../../shared/errors";
import { EmailAlreadyTakenError, InvalidCredentialsError, SessionExpiredError } from "../errors";
import { refreshTokens } from "./refresh";
import { signIn } from "./sign-in";
import { signOut } from "./sign-out";
import { signUp } from "./sign-up";

const meta = { userAgent: "test-agent", ip: "127.0.0.1" };

// Commands depend on Pick<...Repo, ...>, so plain in-memory fakes satisfy
// the types without casting.
function makeSessionRepo() {
  const sessions = new Map<string, SessionRow>();
  let counter = 0;

  return {
    sessions,
    async create(data: { userId: string; expiredAt: Date }): Promise<SessionRow> {
      counter += 1;
      const session = { id: `session-${counter}`, userId: data.userId, expiredAt: data.expiredAt };
      sessions.set(session.id, session);
      return session;
    },
    async findById(id: string): Promise<SessionRow | null> {
      return sessions.get(id) ?? null;
    },
    async deleteById(id: string): Promise<void> {
      sessions.delete(id);
    },
  };
}

function jwtStub(payload: false | Record<string, unknown>): JwtInstance {
  return {
    async sign() {
      return "signed-token";
    },
    async verify() {
      return payload;
    },
  };
}

const signUpIdentityRepo = (exists: boolean) => ({
  async existsByEmail() {
    return exists;
  },
  async createWithUser() {
    return { userId: "user-1", identityId: "identity-1" };
  },
});

const signInIdentityRepo = (identity: IdentityRow | null) => ({
  async findByEmail() {
    return identity;
  },
});

const makeIdentity = async (): Promise<IdentityRow> => ({
  id: "identity-1",
  userId: "user-1",
  type: "email",
  credential: await hashPassword("correct-password"),
  verifiedAt: null,
});

describe("signUp", () => {
  const identityRepo = signUpIdentityRepo;

  it("rejects an already registered email", async () => {
    const sessionRepo = makeSessionRepo();

    expect(
      signUp(
        { identityRepo: identityRepo(true), sessionRepo },
        { email: "a@b.c", password: "12345678" },
        meta,
      ),
    ).rejects.toBeInstanceOf(EmailAlreadyTakenError);
    expect(sessionRepo.sessions.size).toBe(0);
  });

  it("creates a user and a session", async () => {
    const sessionRepo = makeSessionRepo();

    const result = await signUp(
      { identityRepo: identityRepo(false), sessionRepo },
      { email: "a@b.c", password: "12345678" },
      meta,
    );

    expect(result).toEqual({ userId: "user-1", sessionId: "session-1", remember: false });
    expect(sessionRepo.sessions.get("session-1")?.userId).toBe("user-1");
  });

  it("extends the session when remember is set", async () => {
    const shortRepo = makeSessionRepo();
    const longRepo = makeSessionRepo();

    await signUp(
      { identityRepo: identityRepo(false), sessionRepo: shortRepo },
      { email: "a@b.c", password: "12345678" },
      meta,
    );
    const long = await signUp(
      { identityRepo: identityRepo(false), sessionRepo: longRepo },
      { email: "a@b.c", password: "12345678", remember: true },
      meta,
    );

    expect(long.remember).toBe(true);
    const shortExpiry = shortRepo.sessions.get("session-1")!.expiredAt.getTime();
    const longExpiry = longRepo.sessions.get("session-1")!.expiredAt.getTime();
    expect(longExpiry).toBeGreaterThan(shortExpiry);
  });
});

describe("signIn", () => {
  const identityRepo = signInIdentityRepo;
  const identity = makeIdentity;

  it("rejects an unknown email", async () => {
    expect(
      signIn(
        { identityRepo: identityRepo(null), sessionRepo: makeSessionRepo() },
        { email: "a@b.c", password: "whatever" },
        meta,
      ),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
  });

  it("rejects a wrong password", async () => {
    expect(
      signIn(
        { identityRepo: identityRepo(await identity()), sessionRepo: makeSessionRepo() },
        { email: "a@b.c", password: "wrong-password" },
        meta,
      ),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
  });

  it("creates a session on valid credentials", async () => {
    const sessionRepo = makeSessionRepo();

    const result = await signIn(
      { identityRepo: identityRepo(await identity()), sessionRepo },
      { email: "a@b.c", password: "correct-password" },
      meta,
    );

    expect(result).toEqual({ userId: "user-1", sessionId: "session-1", remember: false });
  });
});

describe("refreshTokens", () => {
  const payload = { sub: "user-1", sessionId: "session-1", remember: 1 };

  it("rejects a missing token", async () => {
    expect(
      refreshTokens(
        { sessionRepo: makeSessionRepo() },
        { refreshToken: undefined, refreshJwt: jwtStub(payload) },
        meta,
      ),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it("rejects an invalid token", async () => {
    expect(
      refreshTokens(
        { sessionRepo: makeSessionRepo() },
        { refreshToken: "bad-token", refreshJwt: jwtStub(false) },
        meta,
      ),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it("rejects when the session does not exist", async () => {
    expect(
      refreshTokens(
        { sessionRepo: makeSessionRepo() },
        { refreshToken: "token", refreshJwt: jwtStub(payload) },
        meta,
      ),
    ).rejects.toBeInstanceOf(SessionExpiredError);
  });

  it("rejects and deletes an expired session", async () => {
    const sessionRepo = makeSessionRepo();
    const session = await sessionRepo.create({
      userId: "user-1",
      expiredAt: new Date(Date.now() - 1000),
    });

    expect(
      refreshTokens(
        { sessionRepo },
        { refreshToken: "token", refreshJwt: jwtStub({ ...payload, sessionId: session.id }) },
        meta,
      ),
    ).rejects.toBeInstanceOf(SessionExpiredError);
  });

  it("rotates the session on a valid token", async () => {
    const sessionRepo = makeSessionRepo();
    const session = await sessionRepo.create({
      userId: "user-1",
      expiredAt: new Date(Date.now() + 60_000),
    });

    const result = await refreshTokens(
      { sessionRepo },
      { refreshToken: "token", refreshJwt: jwtStub({ ...payload, sessionId: session.id }) },
      meta,
    );

    expect(sessionRepo.sessions.has(session.id)).toBe(false);
    expect(result.sessionId).not.toBe(session.id);
    expect(result).toMatchObject({ userId: "user-1", remember: true });
  });
});

describe("signOut", () => {
  it("does nothing without a token", async () => {
    const sessionRepo = makeSessionRepo();
    await sessionRepo.create({ userId: "user-1", expiredAt: new Date(Date.now() + 60_000) });

    await signOut({ sessionRepo }, { refreshToken: undefined, refreshJwt: jwtStub(false) });

    expect(sessionRepo.sessions.size).toBe(1);
  });

  it("deletes the session from a valid token", async () => {
    const sessionRepo = makeSessionRepo();
    const session = await sessionRepo.create({
      userId: "user-1",
      expiredAt: new Date(Date.now() + 60_000),
    });

    await signOut(
      { sessionRepo },
      { refreshToken: "token", refreshJwt: jwtStub({ sessionId: session.id }) },
    );

    expect(sessionRepo.sessions.size).toBe(0);
  });
});
