import "server-only";
import { db } from "@/lib/db";
import { SESSION_DAYS, sha256Hex, sign } from "@/lib/auth-config";

// Creates the sign-in tables if the database predates them. Same DDL as
// `prisma migrate diff` produces for the models in prisma/schema.prisma.
const TABLES = [
  `CREATE TABLE IF NOT EXISTS "AuthSession" ("id" TEXT NOT NULL PRIMARY KEY, "method" TEXT NOT NULL, "userAgent" TEXT NOT NULL DEFAULT '', "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "lastSeenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "expiresAt" DATETIME NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS "Passkey" ("id" TEXT NOT NULL PRIMARY KEY, "publicKey" TEXT NOT NULL, "counter" INTEGER NOT NULL DEFAULT 0, "transports" TEXT NOT NULL DEFAULT '', "name" TEXT NOT NULL, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "lastUsedAt" DATETIME)`,
  `CREATE TABLE IF NOT EXISTS "LoginFailure" ("id" TEXT NOT NULL PRIMARY KEY, "ip" TEXT NOT NULL, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE INDEX IF NOT EXISTS "LoginFailure_ip_createdAt_idx" ON "LoginFailure"("ip", "createdAt")`,
  `CREATE INDEX IF NOT EXISTS "LoginFailure_createdAt_idx" ON "LoginFailure"("createdAt")`
];

let ready: Promise<void> | null = null;

export function ensureAuthTables(): Promise<void> {
  ready ??= (async () => {
    for (const sql of TABLES) await db.$executeRawUnsafe(sql);
  })().catch((error) => {
    ready = null;
    throw error;
  });
  return ready;
}

function randomToken(bytes = 32): string {
  const data = crypto.getRandomValues(new Uint8Array(bytes));
  return Buffer.from(data).toString("base64url");
}

// ---------------------------------------------------------------- sessions

export type SessionMethod = "passcode" | "passkey";

/** Creates a session and returns the signed cookie value and its expiry. */
export async function createSession(method: SessionMethod, userAgent: string) {
  await ensureAuthTables();
  const token = randomToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  const cookie = await sign(`${token}:${expiresAt.getTime()}`);
  if (!cookie) throw new Error("Sign-in is not configured.");

  await db.authSession.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  await db.authSession.create({
    data: { id: await sha256Hex(token), method, userAgent: userAgent.slice(0, 300), expiresAt }
  });
  return { cookie, expiresAt };
}

const TOUCH_EVERY = 5 * 60_000;

/** The live session for a cookie token, or null. Refreshes "last active". */
export async function findSession(token: string) {
  await ensureAuthTables();
  const id = await sha256Hex(token);
  const session = await db.authSession.findUnique({ where: { id } });
  if (!session || session.expiresAt <= new Date()) return null;
  if (Date.now() - session.lastSeenAt.getTime() > TOUCH_EVERY) {
    await db.authSession.update({ where: { id }, data: { lastSeenAt: new Date() } }).catch(() => undefined);
  }
  return session;
}

export async function listSessions() {
  await ensureAuthTables();
  return db.authSession.findMany({
    where: { expiresAt: { gt: new Date() } },
    orderBy: { lastSeenAt: "desc" }
  });
}

export async function deleteSession(id: string) {
  await ensureAuthTables();
  await db.authSession.deleteMany({ where: { id } });
}

export async function deleteOtherSessions(keepId: string) {
  await ensureAuthTables();
  await db.authSession.deleteMany({ where: { id: { not: keepId } } });
}

// ---------------------------------------------------------------- passkeys

export async function listPasskeys() {
  await ensureAuthTables();
  return db.passkey.findMany({ orderBy: { createdAt: "asc" } });
}

export async function findPasskey(id: string) {
  await ensureAuthTables();
  return db.passkey.findUnique({ where: { id } });
}

export async function savePasskey(data: { id: string; publicKey: string; counter: number; transports: string[]; name: string }) {
  await ensureAuthTables();
  await db.passkey.create({ data: { ...data, transports: data.transports.join(",") } });
}

export async function markPasskeyUsed(id: string, counter: number) {
  await db.passkey.update({ where: { id }, data: { counter, lastUsedAt: new Date() } });
}

export async function deletePasskey(id: string) {
  await ensureAuthTables();
  await db.passkey.deleteMany({ where: { id } });
}

// ---------------------------------------------------------- rate limiting

// Per address: 5 wrong passcodes in 15 minutes locks that address out for the
// rest of the window. Everywhere: 20 in an hour pauses passcode sign-in for
// everyone (passkeys keep working, so this can't lock the owner out).
const IP_LIMIT = 5;
const IP_WINDOW = 15 * 60_000;
const GLOBAL_LIMIT = 20;
const GLOBAL_WINDOW = 60 * 60_000;

export async function passcodeLocked(ip: string): Promise<boolean> {
  await ensureAuthTables();
  const now = Date.now();
  const [byIp, total] = await Promise.all([
    db.loginFailure.count({ where: { ip, createdAt: { gt: new Date(now - IP_WINDOW) } } }),
    db.loginFailure.count({ where: { createdAt: { gt: new Date(now - GLOBAL_WINDOW) } } })
  ]);
  return byIp >= IP_LIMIT || total >= GLOBAL_LIMIT;
}

export async function recordFailure(ip: string) {
  await ensureAuthTables();
  await db.loginFailure.create({ data: { ip } });
  await db.loginFailure.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - 86_400_000) } } });
}

export async function clearFailures(ip: string) {
  await db.loginFailure.deleteMany({ where: { ip } });
}
