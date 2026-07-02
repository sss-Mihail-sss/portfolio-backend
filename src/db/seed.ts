import { logger } from "../config/logger";
import { db } from "./client";

const seedUsers = [
  { email: "alice@prisma.io", emailVerifiedAt: new Date() },
  { email: "bob@prisma.io" },
  { email: "carol@prisma.io" },
];

let createdCount = 0;

try {
  for (const user of seedUsers) {
    const findPlan = db.sql.public.user
      .select("id")
      .where((f, fns) => fns.eq(f.email, user.email))
      .limit(1)
      .build();
    const [existingUser] = await db.runtime().execute(findPlan);

    if (!existingUser) {
      const insertPlan = db.sql.public.user.insert([user]).returning("id").build();
      const inserted = await db.runtime().execute(insertPlan);
      createdCount += inserted.length;
    }
  }

  logger.info(`Seeded ${createdCount} user${createdCount === 1 ? "" : "s"}.`);
} finally {
  await db.close();
}
