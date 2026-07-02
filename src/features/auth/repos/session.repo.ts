import type { Database } from "../../../db/client";

// Row types are declared with plain strings (not the branded Char<36> the
// driver returns) — repos are the boundary where DB-specific typing ends.
export type SessionRow = {
  id: string;
  userId: string;
  expiredAt: Date;
};

type CreateSessionData = {
  userId: string;
  userAgent: string;
  ipAddress: string;
  expiredAt: Date;
};

export class SessionRepo {
  constructor(private db: Database) {}

  async findById(id: string): Promise<SessionRow | null> {
    const plan = this.db.sql.public.session
      .select("id", "userId", "expiredAt")
      .where((f, fns) => fns.eq(f.id, id))
      .limit(1)
      .build();
    const rows = await this.db.runtime().execute(plan);
    return rows[0] ?? null;
  }

  async create(data: CreateSessionData): Promise<SessionRow> {
    const plan = this.db.sql.public.session
      .insert([data])
      .returning("id", "userId", "expiredAt")
      .build();
    const rows = await this.db.runtime().execute(plan);
    return rows[0];
  }

  async deleteById(id: string): Promise<void> {
    const plan = this.db.sql.public.session
      .delete()
      .where((f, fns) => fns.eq(f.id, id))
      .build();
    await this.db.runtime().execute(plan);
  }

  async deleteExpired(): Promise<void> {
    const plan = this.db.sql.public.session
      .delete()
      .where((f, fns) => fns.lt(f.expiredAt, new Date()))
      .build();
    await this.db.runtime().execute(plan);
  }
}
