/**
 * Restores a dashboard backup (downloaded from Settings → Backups) into a
 * database. Replaces the rows of every table in the backup; tables that are
 * not in the backup (sign-in sessions, failed attempts) are left alone.
 *
 * Local database (prisma/dev.db):
 *   node scripts/restore-backup.js jabx-dashboard-backup-2026-09-27.json --yes
 *
 * Turso (the live database):
 *   TURSO_DATABASE_URL=libsql://... TURSO_AUTH_TOKEN=... \
 *     node scripts/restore-backup.js jabx-dashboard-backup-2026-09-27.json --yes
 */
const fs = require("node:fs");
const { createClient } = require("@libsql/client");

async function main() {
  const [file, flag] = process.argv.slice(2);
  if (!file || flag !== "--yes") {
    console.error("Usage: node scripts/restore-backup.js <backup.json> --yes");
    console.error("This replaces the data in the target database. Add --yes to confirm.");
    process.exit(1);
  }

  const backup = JSON.parse(fs.readFileSync(file, "utf8"));
  if (backup.format !== "jabx-dashboard-backup" || !backup.tables) {
    throw new Error("That file isn't a jabx dashboard backup.");
  }

  const url = process.env.TURSO_DATABASE_URL || "file:prisma/dev.db";
  const client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
  console.log(`Restoring backup from ${backup.createdAt} into ${url.startsWith("file:") ? url : "Turso"}…`);

  // Children before parents when deleting, parents before children when inserting.
  const order = ["Project", "Task", "ChecklistItem", "Note", "Milestone", "ResourceLink", "Activity", "Passkey"];
  const tables = Object.keys(backup.tables).sort((a, b) => {
    const ia = order.indexOf(a) === -1 ? order.length : order.indexOf(a);
    const ib = order.indexOf(b) === -1 ? order.length : order.indexOf(b);
    return ia - ib;
  });

  const statements = ["PRAGMA foreign_keys = OFF"];
  for (const table of [...tables].reverse()) statements.push(`DELETE FROM "${table}"`);
  const writes = statements.map((sql) => ({ sql, args: [] }));

  for (const table of tables) {
    for (const row of backup.tables[table]) {
      const columns = Object.keys(row);
      writes.push({
        sql: `INSERT INTO "${table}" (${columns.map((c) => `"${c}"`).join(", ")}) VALUES (${columns.map(() => "?").join(", ")})`,
        args: columns.map((c) => row[c])
      });
    }
    console.log(`  ${table}: ${backup.tables[table].length} rows`);
  }

  await client.batch(writes, "write");
  console.log("Done.");
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
