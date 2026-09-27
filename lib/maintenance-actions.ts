"use server";

import { revalidatePath } from "next/cache";
import { assertAuthed } from "@/lib/auth";
import { createBackup } from "@/lib/backup";
import { db } from "@/lib/db";
import { fileStorageEnabled, storePhoto } from "@/lib/files";

type Result = { ok: true; message: string } | { ok: false; error: string };

export async function backupNow(): Promise<Result> {
  await assertAuthed();
  if (!fileStorageEnabled()) return { ok: false, error: "File storage isn't set up here." };
  try {
    const { rows } = await createBackup();
    revalidatePath("/dash/settings");
    return { ok: true, message: `Backed up ${rows} records.` };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Backup failed." };
  }
}

function decode(dataUrl: string): { type: string; data: Buffer } | null {
  const match = /^data:([^;,]+);base64,([\s\S]*)$/.exec(dataUrl);
  return match ? { type: match[1], data: Buffer.from(match[2], "base64") } : null;
}

// One-time move of photos saved before file storage existed. Each record is
// updated only after its file is safely stored, so it can be re-run safely.
export async function movePhotosToStorage(): Promise<Result> {
  await assertAuthed();
  if (!fileStorageEnabled()) return { ok: false, error: "File storage isn't set up here." };

  const where = { imageUrl: { startsWith: "data:" } };
  const select = { id: true, imageUrl: true };
  const groups = [
    { folder: "projects", rows: await db.project.findMany({ where, select }), save: (id: string, url: string) => db.project.update({ where: { id }, data: { imageUrl: url } }) },
    { folder: "tasks", rows: await db.task.findMany({ where, select }), save: (id: string, url: string) => db.task.update({ where: { id }, data: { imageUrl: url } }) },
    { folder: "notes", rows: await db.note.findMany({ where, select }), save: (id: string, url: string) => db.note.update({ where: { id }, data: { imageUrl: url } }) }
  ];

  let moved = 0;
  for (const group of groups) {
    for (const row of group.rows) {
      const photo = row.imageUrl ? decode(row.imageUrl) : null;
      if (!photo) continue;
      const url = await storePhoto(photo.data, photo.type, group.folder);
      await group.save(row.id, url);
      moved++;
    }
  }
  revalidatePath("/dash", "layout");
  return { ok: true, message: moved === 0 ? "Nothing to move." : `Moved ${moved} photo${moved === 1 ? "" : "s"}.` };
}
