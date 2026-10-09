import "server-only";

import { db } from "@/lib/db";

const PRESENCE_ID = "laptop";
const WRITE_EVERY_MS = 15_000;
const CREATE_TABLE = `CREATE TABLE IF NOT EXISTS "TeamPresence" ("id" TEXT NOT NULL PRIMARY KEY DEFAULT 'laptop', "lastSeenAt" DATETIME, "lastCheckAt" DATETIME, "lastRunnerHeartbeatAt" DATETIME)`;

let ready: Promise<void> | null = null;
let lastSuccessWriteAt = 0;
let lastCheckWriteAt = 0;

async function ensureTeamPresenceTable(): Promise<void> {
  ready ??= db.$executeRawUnsafe(CREATE_TABLE).then(() => undefined).catch((error) => {
    ready = null;
    throw error;
  });
  return ready;
}

export async function getTeamPresence() {
  await ensureTeamPresenceTable();
  return db.teamPresence.findUnique({ where: { id: PRESENCE_ID } });
}

/** Records a reachable laptop, at most once per 15 seconds per server instance. */
export async function recordTeamBridgeSuccess(lastRunnerHeartbeatAt?: Date | null): Promise<void> {
  const nowMs = Date.now();
  if (nowMs - lastSuccessWriteAt < WRITE_EVERY_MS) return;
  lastSuccessWriteAt = nowMs;
  lastCheckWriteAt = nowMs;
  const now = new Date(nowMs);
  try {
    await ensureTeamPresenceTable();
    await db.teamPresence.upsert({
      where: { id: PRESENCE_ID },
      create: { id: PRESENCE_ID, lastSeenAt: now, lastCheckAt: now, lastRunnerHeartbeatAt },
      update: { lastSeenAt: now, lastCheckAt: now, ...(lastRunnerHeartbeatAt !== undefined ? { lastRunnerHeartbeatAt } : {}) }
    });
  } catch (error) {
    lastSuccessWriteAt = 0;
    throw error;
  }
}

/** Records a failed health probe without changing when the laptop was last reachable. */
export async function recordTeamBridgeCheck(): Promise<void> {
  const nowMs = Date.now();
  if (nowMs - lastCheckWriteAt < WRITE_EVERY_MS) return;
  lastCheckWriteAt = nowMs;
  try {
    await ensureTeamPresenceTable();
    await db.teamPresence.upsert({
      where: { id: PRESENCE_ID },
      create: { id: PRESENCE_ID, lastCheckAt: new Date(nowMs) },
      update: { lastCheckAt: new Date(nowMs) }
    });
  } catch (error) {
    lastCheckWriteAt = 0;
    throw error;
  }
}
