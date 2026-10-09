import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { currentSessionId, isAuthed } from "@/lib/auth";
import { listPasskeys } from "@/lib/auth-store";
import { teamBridgeRequest } from "@/lib/team-bridge";
import { isTeamApiResponse, isTeamHealth } from "@/lib/team-contracts";
import { getTeamPresence, recordTeamBridgeSuccess } from "@/lib/team-presence";
import { resolveTeamRoute } from "@/lib/team-route-policy";
import { readTeamStepUpCookieValue, TEAM_STEP_UP_COOKIE } from "@/lib/team-step-up-cookie";

export const dynamic = "force-dynamic";

type RouteContext = { params: { path: string[] } };

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
}

function sameOrigin(request: Request): boolean {
  return request.headers.get("origin") === new URL(request.url).origin;
}

async function stepUpTime(): Promise<number | null> {
  const sessionId = await currentSessionId();
  if (!sessionId) return null;
  return readTeamStepUpCookieValue(cookies().get(TEAM_STEP_UP_COOKIE)?.value, sessionId);
}

async function offlineResponse() {
  const presence = await getTeamPresence().catch(() => null);
  return json({ online: false, lastSeenAt: presence?.lastSeenAt ?? null }, 503);
}

async function proxy(request: Request, { params }: RouteContext) {
  if (!(await isAuthed())) return json({ error: "unauthorized" }, 401);
  if (request.method === "POST" && !sameOrigin(request)) return json({ error: "forbidden" }, 403);

  const policy = resolveTeamRoute(request.method, params.path, new URL(request.url).search);
  if (!policy) return json({ error: "not_found" }, 404);

  let checkedAt: number | undefined;
  if (policy.requiresStepUp) {
    checkedAt = (await stepUpTime()) ?? undefined;
    if (checkedAt === undefined) {
      const hasPasskey = await listPasskeys().then((items) => items.length > 0).catch(() => true);
      return json({ error: hasPasskey ? "step_up_required" : "passkey_required" }, 403);
    }
  }

  const body = request.method === "POST" ? new Uint8Array(await request.arrayBuffer()) : undefined;
  const result = await teamBridgeRequest({
    method: request.method as "GET" | "POST",
    path: policy.remotePath,
    body,
    contentType: request.headers.get("content-type"),
    stepUpAt: checkedAt
  });
  if (!result.ok) return offlineResponse();

  if (result.status >= 200 && result.status < 300) {
    if (!isTeamApiResponse(request.method as "GET" | "POST", policy.remotePath, result.json)) {
      return json({ error: "invalid_bridge_response" }, 502);
    }
    let heartbeat: Date | null | undefined;
    if (policy.remotePath === "/api/health" && isTeamHealth(result.json)) {
      const parsed = result.json.runner.last_heartbeat_at ? new Date(result.json.runner.last_heartbeat_at) : null;
      heartbeat = parsed && Number.isNaN(parsed.getTime()) ? null : parsed;
    }
    await recordTeamBridgeSuccess(heartbeat).catch(() => undefined);
  }
  return json(result.json, result.status);
}

export async function GET(request: Request, context: RouteContext) {
  return proxy(request, context);
}

export async function POST(request: Request, context: RouteContext) {
  return proxy(request, context);
}
