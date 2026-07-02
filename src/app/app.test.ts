import { describe, expect, it } from "bun:test";

import { app } from "./app";

// Smoke tests over app.handle() — no listening server, no live DB/Redis:
// these paths are validated (or rejected) before any I/O happens.
describe("app", () => {
  it("responds to the health probe", async () => {
    const res = await app.handle(new Request("http://localhost/health"));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: "ok" });
  });

  it("returns 401 for a protected route without a token", async () => {
    const res = await app.handle(new Request("http://localhost/users/me"));

    expect(res.status).toBe(401);
    expect(await res.json()).toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("returns 422 for an invalid sign-up body", async () => {
    const res = await app.handle(
      new Request("http://localhost/auth/sign-up", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "not-an-email", password: "12345678" }),
      }),
    );

    expect(res.status).toBe(422);
    expect(await res.json()).toMatchObject({ code: "VALIDATION_ERROR" });
  });

  it("returns 404 for an unknown route", async () => {
    const res = await app.handle(new Request("http://localhost/unknown-route"));

    expect(res.status).toBe(404);
  });

  it("serves files from public/", async () => {
    const res = await app.handle(new Request("http://localhost/public/logo-white.png"));

    expect(res.status).toBe(200);
  });

  it("returns 404 for a missing public file", async () => {
    const res = await app.handle(new Request("http://localhost/public/nope.png"));

    expect(res.status).toBe(404);
  });
});
