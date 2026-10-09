"use client";

// Typed browser client for dash's /api/team/... routes (lib/team-route-policy.ts lists them).
// Every good answer is checked with lib/team-contracts.ts before it is used; a 503 means the
// laptop is unreachable and is reported to the presence store.
import { isTeamApiResponse } from "@/lib/team-contracts";
import { reportOffline, reportOnline } from "./presence";
import type {
  Attention,
  Decision,
  Message,
  OpenTarget,
  Proposal,
  Run,
  RunEligibility,
  RunnerStatus,
  Snapshot,
  Thread,
  ThreadDetail
} from "./types";

export class TeamApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly code: string | null = null
  ) {
    super(message);
  }
}

// The laptop is off or asleep (dash answered 503 { online: false, lastSeenAt }).
export class TeamOfflineError extends TeamApiError {
  constructor(readonly lastSeenAt: string | null) {
    super(503, "Your MacBook is offline", "offline");
  }
}

export const isOfflineError = (error: unknown): error is TeamOfflineError => error instanceof TeamOfflineError;

const MESSAGES: Record<string, string> = {
  step_up_required: "Confirm with Face ID first",
  passkey_required: "Add Face ID in Settings first",
  forbidden: "This request was refused",
  not_found: "Not found",
  invalid_bridge_response: "The laptop sent an answer dash could not read"
};

async function call<T>(method: "GET" | "POST", path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { accept: "application/json" };
  if (body !== undefined) headers["content-type"] = "application/json";
  let response: Response;
  try {
    response = await fetch(`/api/team${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
      credentials: "same-origin"
    });
  } catch {
    throw new TeamApiError(0, "Could not reach dash");
  }
  const data: unknown = await response.json().catch(() => undefined);
  const record = (typeof data === "object" && data !== null ? data : {}) as Record<string, unknown>;

  if (response.status === 503 && record.online === false) {
    const lastSeenAt = typeof record.lastSeenAt === "string" ? record.lastSeenAt : null;
    reportOffline(lastSeenAt);
    throw new TeamOfflineError(lastSeenAt);
  }
  if (response.status === 401) {
    if (typeof window !== "undefined") window.location.assign("/login");
    throw new TeamApiError(401, "Signed out", "unauthorized");
  }
  if (!response.ok) {
    const code = typeof record.error === "string" ? record.error : null;
    throw new TeamApiError(response.status, (code && (MESSAGES[code] ?? code.replaceAll("_", " "))) || `HTTP ${response.status}`, code);
  }
  reportOnline();
  if (!isTeamApiResponse(method, `/api${path}`, data)) {
    throw new TeamApiError(response.status, `The reply from ${path.split("?")[0]} did not match the expected shape`);
  }
  return data as T;
}

const id = encodeURIComponent;

export const teamApi = {
  snapshot: () => call<Snapshot>("GET", "/snapshot"),
  attention: () => call<Attention>("GET", "/attention"),
  threads: async () => (await call<{ threads: Thread[] }>("GET", "/threads")).threads,
  openThread: (target: OpenTarget) => call<Thread>("POST", "/threads/open", target),
  thread: (threadId: string) => call<ThreadDetail>("GET", `/threads/${id(threadId)}`),
  sendMessage: (threadId: string, body: string, request_id: string) =>
    call<Message>("POST", `/threads/${id(threadId)}/messages`, { body, request_id }),
  proposal: (proposalId: string) => call<Proposal>("GET", `/proposals/${id(proposalId)}`),
  decide: (proposalId: string, request: { decision: Decision; note?: string; version: number; request_id: string }) =>
    call<Proposal>("POST", `/proposals/${id(proposalId)}/decision`, request),
  eligibility: (proposalId: string) => call<RunEligibility>("GET", `/proposals/${id(proposalId)}/eligibility`),
  startRun: (proposalId: string, request_id: string) => call<Run>("POST", `/proposals/${id(proposalId)}/start`, { request_id }),
  runs: async (projectId: string, taskId: string) =>
    (await call<{ runs: Run[] }>("GET", `/runs?project_id=${id(projectId)}&task_id=${id(taskId)}`)).runs,
  run: (runId: string) => call<Run>("GET", `/runs/${id(runId)}`),
  cancelRun: (runId: string, request_id: string) => call<Run>("POST", `/runs/${id(runId)}/cancel`, { request_id }),
  runner: () => call<RunnerStatus>("GET", "/runner")
};

// One request_id per user action. Retrying the action calls run() again with the same id,
// so the laptop can tell a retry from a second send.
export type Action<T> = { request_id: string; run: () => Promise<T> };
export function action<T>(send: (request_id: string) => Promise<T>, newId: () => string = () => crypto.randomUUID()): Action<T> {
  const request_id = newId();
  return { request_id, run: () => send(request_id) };
}
