/**
 * Additive, idempotent schema updates for the live Turso database, run by
 * `npm run build` before `next build` (Vercel exposes TURSO_* at build
 * time). Only ever adds tables and columns, never drops or rewrites, so it
 * is safe to run on every deploy. Keep in step with prisma/schema.prisma.
 *
 * Local development uses `npx prisma db push` instead, so without
 * TURSO_DATABASE_URL this does nothing.
 */
const { createClient } = require("@libsql/client");

const TABLES = [
  `CREATE TABLE IF NOT EXISTS "ChecklistItem" ("id" TEXT NOT NULL PRIMARY KEY, "taskId" TEXT NOT NULL, "text" TEXT NOT NULL, "done" BOOLEAN NOT NULL DEFAULT false, "position" INTEGER NOT NULL DEFAULT 0, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "ChecklistItem_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task" ("id") ON DELETE CASCADE ON UPDATE CASCADE)`,
  `CREATE INDEX IF NOT EXISTS "ChecklistItem_taskId_position_idx" ON "ChecklistItem"("taskId", "position")`,
  `CREATE TABLE IF NOT EXISTS "PushSubscription" ("id" TEXT NOT NULL PRIMARY KEY, "endpoint" TEXT NOT NULL, "p256dh" TEXT NOT NULL, "auth" TEXT NOT NULL, "userAgent" TEXT NOT NULL DEFAULT '', "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE TABLE IF NOT EXISTS "TeamPresence" ("id" TEXT NOT NULL PRIMARY KEY DEFAULT 'laptop', "lastSeenAt" DATETIME, "lastCheckAt" DATETIME, "lastRunnerHeartbeatAt" DATETIME)`
];

// [table, column, definition]
const COLUMNS = [
  ["Task", "repeat", `TEXT NOT NULL DEFAULT ''`],
  ["Task", "nextTaskId", `TEXT`]
];

async function main() {
  const url = process.env.TURSO_DATABASE_URL;
  if (!url) {
    console.log("migrate: TURSO_DATABASE_URL not set, skipping (use prisma db push locally).");
    return;
  }
  const db = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });

  for (const sql of TABLES) await db.execute(sql);

  for (const [table, column, definition] of COLUMNS) {
    const { rows } = await db.execute(`PRAGMA table_info("${table}")`);
    if (rows.some((row) => row.name === column)) continue;
    await db.execute(`ALTER TABLE "${table}" ADD COLUMN "${column}" ${definition}`);
    console.log(`migrate: added ${table}.${column}`);
  }
  console.log("migrate: schema up to date.");
}

main().catch((error) => {
  console.error("migrate failed:", error);
  process.exit(1);
});
