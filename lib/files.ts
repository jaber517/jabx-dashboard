import "server-only";
import { del, get, list, put } from "@vercel/blob";

// Photos and backups live in a *private* Vercel Blob store: files can only be
// read with the store's token, so the dashboard serves photos itself through
// /api/files/…, behind sign-in. Records store that path as their imageUrl.
// Without BLOB_READ_WRITE_TOKEN (local development) photos stay inline as
// data: URLs, the way they were stored before.

export const FILES_ROUTE = "/api/files/";

export function fileStorageEnabled(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/heic": "heic",
  "image/avif": "avif"
};

function randomName(): string {
  return Buffer.from(crypto.getRandomValues(new Uint8Array(12))).toString("base64url");
}

/** Saves a photo and returns the dashboard path that serves it. */
export async function storePhoto(data: Blob | Buffer, contentType: string, folder: string): Promise<string> {
  const extension = EXTENSIONS[contentType] ?? "bin";
  const pathname = `photos/${folder}/${randomName()}.${extension}`;
  await put(pathname, data, { access: "private", contentType, addRandomSuffix: false });
  return `${FILES_ROUTE}${pathname}`;
}

/** The blob pathname behind a stored photo URL, or null for inline/other URLs. */
export function storedPathname(imageUrl: string | null | undefined): string | null {
  if (!imageUrl?.startsWith(FILES_ROUTE)) return null;
  const pathname = imageUrl.slice(FILES_ROUTE.length);
  return /^photos\/[a-z]+\/[A-Za-z0-9_-]+\.[a-z]+$/.test(pathname) ? pathname : null;
}

/** Deletes a stored photo; ignores inline photos and failures. */
export async function removePhoto(imageUrl: string | null | undefined): Promise<void> {
  const pathname = storedPathname(imageUrl);
  if (!pathname || !fileStorageEnabled()) return;
  await del(pathname).catch(() => undefined);
}

export async function readFile(pathname: string) {
  return get(pathname, { access: "private" });
}

// ------------------------------------------------------------- backups

export const BACKUP_PREFIX = "backups/";

export async function saveBackup(name: string, json: string) {
  return put(`${BACKUP_PREFIX}${name}`, json, {
    access: "private",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true
  });
}

export async function listBackups() {
  const { blobs } = await list({ prefix: BACKUP_PREFIX });
  return blobs.sort((a, b) => b.pathname.localeCompare(a.pathname));
}

export async function deleteFiles(pathnames: string[]) {
  if (pathnames.length > 0) await del(pathnames);
}
