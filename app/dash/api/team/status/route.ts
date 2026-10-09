import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";
import { teamBridgeRequest } from "@/lib/team-bridge";
import { isTeamHealth } from "@/lib/team-contracts";
import { getTeamPresence, recordTeamBridgeCheck, recordTeamBridgeSuccess } from "@/lib/team-presence";

export const dynamic = "force-dynamic";

type TeamStatus = { online: boolean; lastSeenAt: Date | null; runnerOnline: boolean };

let cached: { expiresAt: number; promise: Promise<TeamStatus> } | null = null;

async function readStatus(): Promise<TeamStatus> {
  const result = await teamBridgeRequest({ method: "GET", path: "/api/health" });
  let online = false;
  let runnerOnline = false;
  if (result.ok && result.status >= 200 && result.status < 300 && isTeamHealth(result.json)) {
    online = true;
    runnerOnline = result.json.runner.online;
    const rawHeartbeat = result.json.runner.last_heartbeat_at;
    const parsedHeartbeat = rawHeartbeat ? new Date(rawHeartbeat) : null;
    const heartbeat = parsedHeartbeat && Number.isNaN(parsedHeartbeat.getTime()) ? null : parsedHeartbeat;
    await recordTeamBridgeSuccess(heartbeat).catch(() => undefined);
  } else {
    await recordTeamBridgeCheck().catch(() => undefined);
  }
  const presence = await getTeamPresence().catch(() => null);
  return {
    online,
    lastSeenAt: presence?.lastSeenAt ?? null,
    runnerOnline
  };
}

function cachedStatus(): Promise<TeamStatus> {
  const now = Date.now();
  if (cached && cached.expiresAt > now) return cached.promise;
  const promise = readStatus();
  cached = { expiresAt: now + 5_000, promise };
  promise.catch(() => {
    if (cached?.promise === promise) cached = null;
  });
  return promise;
}

export async function GET() {
  if (!(await isAuthed())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const status = await cachedStatus();
  return NextResponse.json(status, { headers: { "Cache-Control": "private, no-store" } });
}
