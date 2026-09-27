import "server-only";
import { db } from "@/lib/db";
import { todayKey } from "@/lib/dates";
import { deleteFiles, listBackups, saveBackup } from "@/lib/files";

// A backup is every table's rows as JSON, one file per day
// (backups/YYYY-MM-DD.json in the private file store), newest 30 kept.
// Sign-in sessions and failed-attempt records are left out: they're
// short-lived and restoring them would only sign old devices back in.
// Photos are separate files in the same store and aren't copied.
// Restore with scripts/restore-backup.js.

const SKIP = new Set(["_prisma_migrations", "AuthSession", "LoginFailure"]);
const KEEP = 30;

export async function createBackup() {
  const tables = await db.$queryRawUnsafe<{ name: string }[]>(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
  );
  const data: Record<string, unknown[]> = {};
  let rows = 0;
  for (const { name } of tables) {
    if (SKIP.has(name)) continue;
    data[name] = await db.$queryRawUnsafe<unknown[]>(`SELECT * FROM "${name.replace(/"/g, '""')}"`);
    rows += data[name].length;
  }

  const json = JSON.stringify(
    { format: "jabx-dashboard-backup", version: 1, createdAt: new Date().toISOString(), tables: data },
    (_key, value) => (typeof value === "bigint" ? Number(value) : value)
  );
  const name = `${todayKey()}.json`;
  await saveBackup(name, json);

  const backups = await listBackups();
  await deleteFiles(backups.slice(KEEP).map((blob) => blob.pathname));

  return { name, rows, bytes: json.length };
}

/** Counts photos still stored inside the database as data: URLs. */
export async function countInlinePhotos(): Promise<number> {
  const where = { imageUrl: { startsWith: "data:" } };
  const [projects, tasks, notes] = await Promise.all([
    db.project.count({ where }),
    db.task.count({ where }),
    db.note.count({ where })
  ]);
  return projects + tasks + notes;
}
