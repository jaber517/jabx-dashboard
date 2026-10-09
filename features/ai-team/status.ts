// Browser-safe display rules, ported from Jabx apps/dashboard/lib/status.ts. Status comes
// only from the task projection, never from elapsed time or git activity.
import type { Task } from "./types";

export type EmployeeStatus = {
  status: "working" | "in_review" | "none";
  label: string;
  stale: boolean;
  task: Task | null;
  last_activity: string | null;
};

const latest = (a: string | null, b: string | null) => (!a ? b : !b ? a : Date.parse(b) > Date.parse(a) ? b : a);
const byUpdated = (a: Task, b: Task) => Date.parse(b.updated_at ?? "") - Date.parse(a.updated_at ?? "") || 0;

export function employeeStatus(employeeId: string, tasks: Task[]): EmployeeStatus {
  const own = tasks.filter((task) => task.employee_id === employeeId);
  const last_activity = own.reduce<string | null>((at, task) => latest(at, task.updated_at), null);
  const running = own.filter((task) => task.state === "running").sort(byUpdated);
  if (running.length) {
    return { status: "working", label: "Working", stale: running.some((task) => task.stale), task: running[0], last_activity };
  }
  const review = own.filter((task) => task.state === "needs_review").sort(byUpdated);
  if (review.length) return { status: "in_review", label: "In review", stale: false, task: review[0], last_activity };
  return { status: "none", label: "No tracked activity", stale: false, task: null, last_activity };
}

// Adam leads rather than runs tasks, so his card summarises the team's open work.
export type LeadSummary = { running: number; review: number; failed: number; waiting: number; focus: Task | null };

export function leadSummary(tasks: Task[]): LeadSummary {
  const pick = (state: string) => tasks.filter((task) => task.state === state).sort(byUpdated);
  const review = pick("needs_review");
  const failed = pick("failed");
  const running = pick("running");
  const waiting = tasks.filter((task) => ["backlog", "queued", "assigned", "blocked"].includes(task.state));
  return {
    running: running.length,
    review: review.length,
    failed: failed.length,
    waiting: waiting.length,
    focus: review[0] ?? running[0] ?? null
  };
}

const NEXT_STEPS: Record<string, string> = {
  assign: "Adam assigns it to someone",
  dispatch: "Adam starts the run",
  wait: "Running: wait for the result",
  "reconcile stale attempt": "The run looks stuck: Adam checks it",
  review: "Adam reviews the result",
  accept: "Review approved: Adam accepts it",
  "retry or cancel": "Adam retries or cancels it",
  integrate: "Adam merges the change",
  none: "Nothing, it is finished"
};

export function nextStepLabel(action: string | null) {
  if (!action) return null;
  if (action.startsWith("unblock: ")) return `Blocked: ${action.slice("unblock: ".length)}`;
  return NEXT_STEPS[action] ?? action;
}

export const STATE_ORDER = ["running", "needs_review", "assigned", "queued", "backlog", "blocked", "failed", "accepted", "cancelled"];

const STATE_LABELS: Record<string, string> = {
  running: "Running",
  needs_review: "Needs review",
  assigned: "Assigned",
  queued: "Queued",
  backlog: "Backlog",
  blocked: "Blocked",
  failed: "Failed",
  accepted: "Accepted",
  cancelled: "Cancelled"
};

export const stateLabel = (state: string) => STATE_LABELS[state] ?? state.replaceAll("_", " ");

// Badge tones, as text-* classes from the tone tokens (see lib/constants.ts).
export const tones = {
  working: "text-tone-blue",
  review: "text-tone-violet",
  done: "text-tone-green",
  blocked: "text-tone-red",
  queued: "text-tone-slate",
  waiting: "text-tone-amber",
  neutral: "text-muted-foreground"
} as const;

export type Tone = keyof typeof tones;

export function stateTone(state: string): Tone {
  if (state === "running") return "working";
  if (state === "needs_review") return "review";
  if (state === "accepted") return "done";
  if (state === "blocked" || state === "failed") return "blocked";
  if (state === "queued" || state === "assigned") return "queued";
  return "neutral";
}

export function groupByState(tasks: Task[]) {
  const groups = new Map<string, Task[]>();
  for (const state of STATE_ORDER) groups.set(state, []);
  for (const task of tasks) {
    if (!groups.has(task.state)) groups.set(task.state, []);
    groups.get(task.state)!.push(task);
  }
  return Array.from(groups)
    .filter(([, list]) => list.length)
    .map(([state, list]) => ({ state, tasks: list.sort(byUpdated) }));
}

export function assigneeName(task: Task, names: Record<string, string>) {
  if (!task.employee_id) return "Unassigned";
  return names[task.employee_id] ?? task.employee_id;
}

export function formatAge(fromIso: string | null, now: number) {
  if (!fromIso) return "never";
  const seconds = Math.max(0, Math.round((now - Date.parse(fromIso)) / 1000));
  if (!Number.isFinite(seconds)) return "never";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours} h ago`;
  return `${Math.round(hours / 24)} days ago`;
}

export function formatTime(iso: string | null) {
  if (!iso) return "—";
  const date = new Date(iso);
  return Number.isFinite(date.getTime())
    ? date.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
    : iso;
}

// The laptop's reachability as the nav dot and the offline header show it.
// null: not known yet (nothing is drawn, so nothing shifts when it arrives).
export function presenceDot(online: boolean | null) {
  if (online === null) return null;
  return online ? { label: "online", className: "bg-success" } : { label: "offline", className: "bg-muted-foreground" };
}

export function lastSeenText(lastSeenAt: string | null, now: number) {
  return lastSeenAt ? `Last seen ${formatAge(lastSeenAt, now)}.` : "Not seen yet.";
}
