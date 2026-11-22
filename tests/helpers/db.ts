import { PrismaClient } from "@prisma/client";

function requireTestDatabaseUrl() {
  const testUrl = process.env.TEST_DATABASE_URL;
  const dbUrl = process.env.DATABASE_URL;

  if (!testUrl) {
    throw new Error("TEST_DATABASE_URL is required for integration tests.");
  }

  if (dbUrl && testUrl === dbUrl) {
    throw new Error("TEST_DATABASE_URL must not be the same as DATABASE_URL.");
  }

  return testUrl;
}

export function createTestPrisma() {
  const url = requireTestDatabaseUrl();
  return new PrismaClient({
    datasources: { db: { url } },
    log: ["error"],
  });
}

export async function resetDb(prisma: PrismaClient) {
  const tablenames = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename <> '_prisma_migrations'
  `;

  for (const { tablename } of tablenames) {
    if (tablename === "_prisma_migrations") continue;
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${tablename}" RESTART IDENTITY CASCADE;`);
  }
}
