import type { Database } from "../../../db/client";

import { hashPassword } from "../../../shared/crypto";

// Row types are declared with plain strings (not the branded Char<36> the
// driver returns) — repos are the boundary where DB-specific typing ends.
export type IdentityRow = {
  id: string;
  userId: string;
  type: string;
  credential: string | null;
  verifiedAt: Date | null;
};

export class IdentityRepo {
  constructor(private db: Database) {}

  async findByEmail(email: string): Promise<IdentityRow | null> {
    const plan = this.db.sql.public.identity
      .select("id", "userId", "credential", "type", "verifiedAt")
      .where((f, fns) => fns.and(fns.eq(f.identifier, email), fns.eq(f.type, "email")))
      .limit(1)
      .build();
    const rows = await this.db.runtime().execute(plan);
    return rows[0] ?? null;
  }

  async existsByEmail(email: string): Promise<boolean> {
    return (await this.findByEmail(email)) !== null;
  }

  async createWithUser(
    email: string,
    password: string,
  ): Promise<{ userId: string; identityId: string }> {
    const credential = await hashPassword(password);

    // Both inserts run in a single transaction — if identity creation fails,
    // the user row is rolled back automatically.
    return this.db.transaction(async (tx) => {
      const userPlan = tx.sql.public.user.insert([{ email }]).returning("id").build();
      const [user] = await tx.execute(userPlan);

      const identityPlan = tx.sql.public.identity
        .insert([{ userId: user.id, type: "email", identifier: email, credential }])
        .returning("id")
        .build();
      const [identity] = await tx.execute(identityPlan);

      return { userId: user.id, identityId: identity.id };
    });
  }
}
