export type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

export function isJsonValue(value: unknown): value is JsonValue {
  if (value === null || typeof value === "string" || typeof value === "boolean") return true;
  if (typeof value === "number") return Number.isFinite(value);
  if (Array.isArray(value)) return value.every(isJsonValue);
  if (typeof value !== "object") return false;
  return Object.values(value as Record<string, unknown>).every(isJsonValue);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

function isThread(value: unknown): boolean {
  return isRecord(value) &&
    typeof value.thread_id === "string" &&
    ["adam", "person", "task"].includes(String(value.kind)) &&
    isNullableString(value.employee_id) &&
    isNullableString(value.project_id) &&
    isNullableString(value.task_id) &&
    typeof value.title === "string" &&
    typeof value.unread === "number" &&
    isNullableString(value.last_message_at) &&
    typeof value.pending_reply === "boolean";
}

function isProposal(value: unknown): boolean {
  return isRecord(value) &&
    ["proposal_id", "thread_id", "project_id", "employee_task", "title", "objective", "created_at"].every(
      (key) => typeof value[key] === "string"
    ) &&
    typeof value.version === "number" &&
    ["proposed", "approved", "changes_requested", "declined", "superseded"].includes(String(value.status)) &&
    Array.isArray(value.scope) && value.scope.every((item) => typeof item === "string") &&
    Array.isArray(value.checks) && value.checks.every((item) => typeof item === "string") &&
    Array.isArray(value.sources) && value.sources.every((item) => typeof item === "string") &&
    typeof value.budget_minutes === "number" &&
    isNullableString(value.decided_at) &&
    isNullableString(value.task_id);
}

function isRun(value: unknown): boolean {
  return isRecord(value) &&
    ["run_id", "proposal_id", "project_id", "task_id", "employee_task", "queued_at"].every(
      (key) => typeof value[key] === "string"
    ) &&
    ["queued", "starting", "running", "finished", "failed", "cancel_requested", "cancelled", "needs_attention"].includes(
      String(value.status)
    ) &&
    ["attempt_id", "started_at", "finished_at", "last_heartbeat_at", "activity", "cause", "report"].every((key) =>
      isNullableString(value[key])
    );
}

function isMessage(value: unknown): boolean {
  return isRecord(value) &&
    ["message_id", "thread_id", "body", "created_at"].every((key) => typeof value[key] === "string") &&
    ["jaber", "adam", "system"].includes(String(value.role)) &&
    isNullableString(value.proposal_id) &&
    ["sent", "failed"].includes(String(value.status));
}

function isTimelineEvent(value: unknown): boolean {
  return isRecord(value) &&
    ["event_id", "type", "at", "summary"].every((key) => typeof value[key] === "string") &&
    isNullableString(value.actor);
}

export type TeamHealth = {
  dashboard: true;
  runner: { online: boolean; last_heartbeat_at: string | null };
  now: string;
};

export function isTeamHealth(value: unknown): value is TeamHealth {
  if (!isRecord(value) || value.dashboard !== true || typeof value.now !== "string" || !isRecord(value.runner)) {
    return false;
  }
  return typeof value.runner.online === "boolean" && isNullableString(value.runner.last_heartbeat_at);
}

/** Lightweight runtime validation for successful responses from every allowlisted laptop route. */
export function isTeamApiResponse(method: "GET" | "POST", pathWithQuery: string, value: unknown): boolean {
  const path = pathWithQuery.split("?", 1)[0];
  if (path === "/api/health") return isTeamHealth(value);
  if (!isRecord(value)) return false;

  if (method === "GET" && path === "/api/snapshot") {
    return typeof value.generated_at === "string" &&
      Array.isArray(value.projects) && value.projects.every(isRecord) &&
      Array.isArray(value.employees) && value.employees.every(isRecord) &&
      Array.isArray(value.tasks) && value.tasks.every(isRecord);
  }
  if (method === "GET" && path === "/api/attention") return Array.isArray(value.items) && value.items.every(isRecord);
  if (method === "GET" && path === "/api/threads") return Array.isArray(value.threads) && value.threads.every(isThread);
  if (method === "POST" && path === "/api/threads/open") return isThread(value);
  if (/^\/api\/threads\/[^/]+$/.test(path)) {
    return method === "GET"
      ? isThread(value.thread) && Array.isArray(value.messages) && value.messages.every(isMessage) &&
          Array.isArray(value.events) && value.events.every(isTimelineEvent)
      : false;
  }
  if (method === "POST" && /^\/api\/threads\/[^/]+\/messages$/.test(path)) return isMessage(value);
  if (/^\/api\/proposals\/[^/]+$/.test(path)) return isProposal(value);
  if (method === "GET" && /^\/api\/proposals\/[^/]+\/eligibility$/.test(path)) {
    return typeof value.can_start === "boolean" && isNullableString(value.reason);
  }
  if (method === "POST" && /^\/api\/proposals\/[^/]+\/(decision|start)$/.test(path)) {
    return path.endsWith("/decision") ? isProposal(value) : isRun(value);
  }
  if (method === "GET" && path === "/api/runs") return Array.isArray(value.runs) && value.runs.every(isRun);
  if (/^\/api\/runs\/[^/]+$/.test(path)) return isRun(value);
  if (method === "POST" && /^\/api\/runs\/[^/]+\/cancel$/.test(path)) return isRun(value);
  if (method === "GET" && path === "/api/runner") {
    return typeof value.online === "boolean" && isNullableString(value.last_heartbeat_at);
  }
  return false;
}
