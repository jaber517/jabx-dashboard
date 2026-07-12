/**
 * Copies the local SQLite database (prisma/dev.db) to a Turso database:
 * schema first, then all rows. Destructive on the Turso side (drops tables).
 *
 * Usage:
 *   TURSO_DATABASE_URL=libsql://... TURSO_AUTH_TOKEN=... node scripts/migrate-to-turso.js
 */
const { createClient } = require("@libsql/client");

async function main() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url) {
    console.error("Set TURSO_DATABASE_URL (and TURSO_AUTH_TOKEN) first.");
    process.exit(1);
  }

  const local = createClient({ url: "file:prisma/dev.db" });
  const remote = createClient({ url, authToken });

  const { rows: tables } = await local.execute(
    "SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name != '_prisma_migrations'"
  );

  for (const table of tables) {
    console.log(`Recreating table ${table.name}...`);
    await remote.execute(`DROP TABLE IF EXISTS "${table.name}"`);
    await remote.execute(table.sql);
  }

  const { rows: indexes } = await local.execute(
    "SELECT sql FROM sqlite_master WHERE type='index' AND sql IS NOT NULL"
  );

  for (const index of indexes) {
    await remote.execute(index.sql);
  }

  for (const table of tables) {
    const { rows, columns } = await local.execute(`SELECT * FROM "${table.name}"`);
    console.log(`Copying ${rows.length} rows into ${table.name}...`);

    if (rows.length === 0) continue;

    const cols = columns.map((c) => `"${c}"`).join(", ");
    const placeholders = columns.map(() => "?").join(", ");
    const statements = rows.map((row) => ({
      sql: `INSERT INTO "${table.name}" (${cols}) VALUES (${placeholders})`,
      args: columns.map((c) => row[c])
    }));

    await remote.batch(statements, "write");
  }

  console.log("Done. Turso now mirrors your local database.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
