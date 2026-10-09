// Display rules for runs (status badges, the start confirmation, elapsed times) and the
// feed that follows one run until it reaches a final state. Ported from Jabx
// apps/dashboard/lib/client/runs.ts; the poll interval follows features/ai-team/polling.ts.
import { backoffMs, FAST_MS, MAX_BACKOFF_MS, realTimers, type Timers } from "./polling";
import type { Tone } from "./status";
import type { Proposal, Run, RunEligibility, RunStatus } from "./types";

export const RUN_STATUS: Record<RunStatus, { label: string; tone: Tone }> = {
  queued: { label: "Queued", tone: "queued" },
  starting: { label: "Starting", tone: "working" },
  running: { label: "Running", tone: "working" },
  finished: { label: "Finished", tone: "done" },
  failed: { label: "Failed", tone: "blocked" },
  cancel_requested: { label: "Cancel requested", tone: "waiting" },
  cancelled: { label: "Cancelled", tone: "neutral" },
  needs_attention: { label: "Needs attention", tone: "blocked" }
};

const FINAL: RunStatus[] = ["finished", "failed", "cancelled", "needs_attention"];
export const isFinalRun = (status: RunStatus) => FINAL.includes(status);
// A run can be cancelled until the runner has stopped it or been asked to.
export const canCancel = (status: RunStatus) => status === "queued" || status === "starting" || status === "running";
export const runHasCause = (status: RunStatus) => status === "failed" || status === "cancelled" || status === "needs_attention";

// Start is offered only on an approved proposal the server says can start.
export const showStart = (proposal: Proposal, eligibility: RunEligibility | null) =>
  proposal.status === "approved" && !!proposal.task_id && eligibility?.can_start === true;

// Engines the runner uses for each web-runnable task (config/dashboard-policy.json).
const ENGINES: Record<string, string> = {
  "cody.code_review": "Codex, read-only",
  "cody.feature": "Codex, writes only in a new worktree, no network",
  "cody.bug_fix": "Codex, writes only in a new worktree, no network",
  "alina.frontend": "Claude Opus 5.5, writes only in a new worktree, no network",
  "alina.bug_fix": "Claude Opus 5.5, writes only in a new worktree, no network",
  "maya.discovery": "Kimi + Exa web research, sandboxed: can only write to its run folder",
  "maya.fact_check": "Kimi + Exa web research, sandboxed: can only write to its run folder",
  "maya.synthesis": "Claude Sonnet 5.5, sandboxed: reads only its inputs, writes only its output folder, no web",
  "maya.positioning": "Claude Sonnet 5.5, sandboxed: reads only its inputs, writes only its output folder, no web",
  "maya.marketing_copy": "Claude Sonnet 5.5, sandboxed: reads only its inputs, writes only its output folder, no web",
  "maya.experiment_plan": "Claude Sonnet 5.5, sandboxed: reads only its inputs, writes only its output folder, no web"
};

// "cody.code_review" -> "Cody · code review".
export function describeTask(employeeTask: string) {
  const [employee, task = ""] = employeeTask.split(".");
  const name = employee ? employee.charAt(0).toUpperCase() + employee.slice(1) : employeeTask;
  return { name, who: task ? `${name} · ${task.replaceAll("_", " ")}` : name, engine: ENGINES[employeeTask] ?? null };
}

// What the Start dialog says will happen, line by line.
export function startSummary(proposal: Proposal) {
  const { name, who, engine } = describeTask(proposal.employee_task);
  const research = proposal.employee_task === "maya.discovery" || proposal.employee_task === "maya.fact_check";
  const synthesis = ["maya.synthesis", "maya.positioning", "maya.marketing_copy", "maya.experiment_plan"].includes(proposal.employee_task);
  const codeChange = ["cody.feature", "cody.bug_fix", "alina.frontend", "alina.bug_fix"].includes(proposal.employee_task);
  const releaseScoped = ["maya.positioning", "maya.marketing_copy", "maya.experiment_plan"].includes(proposal.employee_task);
  return {
    who,
    engine: engine ?? "Set by the runner for this task",
    project: proposal.project_id,
    locationLabel: codeChange ? "Worktree" : research || synthesis ? "Run folder" : "Repo",
    location: codeChange
      ? `A new isolated worktree for the ${proposal.project_id} repository`
      : research || synthesis
        ? `A sandboxed run folder under the ${proposal.project_id} project`
        : `The ${proposal.project_id} repository registered for the runner`,
    budget: `${proposal.budget_minutes} min`,
    outcome: codeChange
      ? `Works on a new branch ${proposal.task_id ? `jabx/web/${proposal.task_id}` : "under jabx/web/"} in its own worktree. Nothing is committed, merged or deployed: the branch comes back for Adam to review and the project's checks run in a sandbox.`
      : research
        ? "Uses your Kimi allowance (5-hour window). Findings come back for Adam to review; nothing is published."
        : synthesis
          ? "Uses your Claude Pro allowance (Sonnet 5.5). Built only from the listed accepted sources; the draft comes back for Adam to review; nothing is published."
          : `${name}’s report comes back for Adam to review; nothing is merged or accepted automatically.`,
    independence: codeChange
      ? proposal.employee_task.startsWith("cody.")
        ? "Uses your Codex allowance."
        : "Uses your Claude Pro allowance (Opus 5.5)."
      : proposal.employee_task === "cody.code_review"
        ? "Make sure this work was not written by Codex, so the review is independent."
        : releaseScoped
          ? "Confirm the sources describe what ships in the current release."
          : null
  };
}

// "12 min 5 s" style duration between two times; "—" when unknown.
export function formatElapsed(fromIso: string | null, toMs: number) {
  if (!fromIso) return "—";
  const start = Date.parse(fromIso);
  if (!Number.isFinite(start)) return "—";
  const seconds = Math.max(0, Math.round((toMs - start) / 1000));
  if (seconds < 60) return `${seconds} s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ${seconds % 60} s`;
  return `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
}

export function lastHeard(heartbeatIso: string | null, now: number) {
  if (!heartbeatIso) return "Not heard from yet";
  const at = Date.parse(heartbeatIso);
  if (!Number.isFinite(at)) return "Not heard from yet";
  const seconds = Math.max(0, Math.round((now - at) / 1000));
  if (seconds < 120) return `Last heard ${seconds}s ago`;
  return `Last heard ${Math.round(seconds / 60)} min ago`;
}

// Network trouble, server errors, timeouts and rate limits are worth retrying; any other 4xx
// (not found, refused, signed out) will not get better by asking again.
export function isPermanentError(error: unknown) {
  const status = (error as { status?: unknown } | null)?.status;
  return typeof status === "number" && status >= 400 && status < 500 && status !== 408 && status !== 429;
}

export const errorText = (error: unknown, fallback: string) => (error instanceof Error && error.message ? error.message : fallback);

// How a poller is doing: live, retrying after errors (with the next delay), or stopped on an
// error that retrying will not fix. last_success_at is when the shown data was last fresh.
export type PollHealth =
  | { state: "live"; last_success_at: number | null }
  | { state: "retrying"; last_success_at: number | null; failures: number; retry_in_ms: number; error: string }
  | { state: "stopped"; last_success_at: number | null; error: string };

// Run statuses only move forward: queued -> starting -> running -> cancel_requested -> final.
const RANK: Record<RunStatus, number> = {
  queued: 0,
  starting: 1,
  running: 2,
  cancel_requested: 3,
  finished: 4,
  failed: 4,
  cancelled: 4,
  needs_attention: 4
};
const heartbeat = (run: Run) => (run.last_heartbeat_at ? Date.parse(run.last_heartbeat_at) || 0 : 0);

// Whether `next` may replace `current`: never a step back in status, never a final state
// for a different one, and at the same status never an older heartbeat.
export function isNewerRun(next: Run, current: Run) {
  if (next.run_id !== current.run_id) return false;
  const a = RANK[next.status];
  const b = RANK[current.status];
  if (a !== b) return a > b;
  // A final run only changes if its record was filled in later (report, cause, end time).
  if (b === 4) {
    return (
      next.status === current.status &&
      (next.report !== current.report || next.cause !== current.cause || next.finished_at !== current.finished_at)
    );
  }
  return heartbeat(next) >= heartbeat(current);
}

// Folds a freshly loaded list into the one on screen, keeping a newer copy of any run.
export function mergeRuns(current: Run[], incoming: Run[]) {
  const known = new Map(current.map((run) => [run.run_id, run]));
  return incoming.map((run) => {
    const mine = known.get(run.run_id);
    return mine && !isNewerRun(run, mine) ? mine : run;
  });
}

const intervalOf = (interval: number | (() => number)) => (typeof interval === "function" ? interval() : interval);

// The one owner of a run's state on screen. The parent's list, the poller and a cancel all go
// through it: a response that started before a cancel, or that would move the run backwards,
// is dropped. Polls every `intervalMs` while active and stops on a final state; failed loads
// back off up to `maxDelayMs`, and an error retrying cannot fix stops the poller.
export function createRunFeed(
  initial: Run,
  {
    load,
    onRun,
    onLoad,
    onHealth,
    intervalMs = FAST_MS,
    maxDelayMs = MAX_BACKOFF_MS,
    timers = realTimers,
    now = Date.now
  }: {
    load: () => Promise<Run>;
    onRun: (run: Run, previous: Run) => void;
    onLoad?: (run: Run) => void;
    onHealth?: (health: PollHealth) => void;
    intervalMs?: number | (() => number);
    maxDelayMs?: number;
    timers?: Timers;
    now?: () => number;
  }
) {
  let current = initial;
  let live = true;
  let polling = false;
  let inFlight = false;
  let handle: unknown;
  let generation = 0;
  let failures = 0;
  let lastSuccess: number | null = null;
  let health: PollHealth = { state: "live", last_success_at: null };
  const setHealth = (next: PollHealth) => {
    health = next;
    onHealth?.(next);
  };

  function accept(next: Run) {
    if (!live || next === current || !isNewerRun(next, current)) return false;
    const previous = current;
    current = next;
    onRun(next, previous);
    return true;
  }

  // One load. A cancel sent while it was in flight makes its answer obsolete.
  async function fetchOnce() {
    const started = generation;
    try {
      const next = await load();
      if (!live) return;
      failures = 0;
      lastSuccess = now();
      if (started === generation) accept(next);
      onLoad?.(next);
      if (health.state !== "live") setHealth({ state: "live", last_success_at: lastSuccess });
      else health = { state: "live", last_success_at: lastSuccess };
    } catch (error) {
      if (!live) return;
      if (isPermanentError(error)) {
        setHealth({ state: "stopped", last_success_at: lastSuccess, error: errorText(error, "This run could not be loaded") });
        throw error;
      }
      failures += 1;
      setHealth({
        state: "retrying",
        last_success_at: lastSuccess,
        failures,
        retry_in_ms: backoffMs(intervalOf(intervalMs), failures, maxDelayMs),
        error: errorText(error, "This run could not be loaded")
      });
    }
  }

  const schedule = (ms: number) => {
    timers.clearTimeout(handle);
    if (live && polling && !isFinalRun(current.status)) handle = timers.setTimeout(tick, ms);
  };
  async function tick() {
    if (!live || inFlight) return;
    inFlight = true;
    try {
      await fetchOnce();
    } catch {
      polling = false;
      return;
    } finally {
      inFlight = false;
    }
    schedule(backoffMs(intervalOf(intervalMs), failures, maxDelayMs));
  }

  return {
    get: () => current,
    health: () => health,
    // A copy from somewhere else (the parent's list); kept only if it is newer.
    offer: (run: Run) => accept(run),
    // Follow the run. `immediate` loads once at once, even a final run: reading it is what
    // acknowledges a failed run's attention item.
    start({ immediate = false } = {}) {
      if (!live) return Promise.resolve();
      polling = true;
      if (!immediate) {
        schedule(intervalOf(intervalMs));
        return Promise.resolve();
      }
      timers.clearTimeout(handle);
      return tick();
    },
    // Sends a change (a cancel). Reads already in flight are ignored once it is sent.
    async mutate(send: () => Promise<Run>) {
      generation += 1;
      const next = await send();
      generation += 1;
      accept(next);
      if (polling) schedule(intervalOf(intervalMs));
      return next;
    },
    stop() {
      live = false;
      polling = false;
      timers.clearTimeout(handle);
    }
  };
}

// Loads the run every `intervalMs` while it is active and stops on a final state.
// Returns a function that stops polling.
export function pollRun(
  run: Run,
  load: () => Promise<Run>,
  onRun: (run: Run) => void,
  { intervalMs = FAST_MS, timers = realTimers, onHealth }: { intervalMs?: number | (() => number); timers?: Timers; onHealth?: (health: PollHealth) => void } = {}
) {
  const feed = createRunFeed(run, { load, onRun, onHealth, intervalMs, timers });
  void feed.start();
  return () => feed.stop();
}

// Failed runs and runs that need attention stay in the attention strip until one is read.
export const needsAcknowledging = (run: Run) => run.status === "failed" || run.status === "needs_attention";

// The runs a proposal started, newest first.
export const runsForProposal = (runs: Run[], proposalId: string) =>
  runs
    .filter((run) => run.proposal_id === proposalId)
    .sort((a, b) => (Date.parse(b.queued_at) || 0) - (Date.parse(a.queued_at) || 0));

// What a screen reader hears when a run changes status; null when nothing changed.
export function runAnnouncement(previous: Run | null, next: Run) {
  if (previous && previous.status === next.status) return null;
  const who = describeTask(next.employee_task).who;
  const cause = runHasCause(next.status) && next.cause ? `: ${next.cause}` : "";
  return `Run ${who}: ${RUN_STATUS[next.status].label}${cause}`;
}

// Where run cards sit in a task conversation: after the last row at or before queued_at.
export function placeRuns<T>(
  rows: T[],
  rowTime: (row: T) => string,
  runs: Run[]
): ({ kind: "row"; row: T } | { kind: "run"; run: Run })[] {
  const ms = (iso: string) => {
    const t = Date.parse(iso);
    return Number.isFinite(t) ? t : 0;
  };
  const pending = [...runs].sort((a, b) => ms(a.queued_at) - ms(b.queued_at));
  const out: ({ kind: "row"; row: T } | { kind: "run"; run: Run })[] = [];
  for (const row of rows) {
    while (pending.length && ms(pending[0].queued_at) < ms(rowTime(row))) out.push({ kind: "run", run: pending.shift()! });
    out.push({ kind: "row", row });
  }
  for (const run of pending) out.push({ kind: "run", run });
  return out;
}

// Adam writes light Markdown in reports. Only **bold** and `code` are rendered (as React
// nodes, see format.tsx); this splits the text into those parts.
export type InlinePart = { kind: "text" | "bold" | "code"; text: string; children?: InlinePart[] };

export function parseInline(text: string): InlinePart[] {
  return text
    .split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
    .filter((part) => part !== "")
    .map((part): InlinePart => {
      if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
        return { kind: "bold", text: part.slice(2, -2), children: parseInline(part.slice(2, -2)) };
      }
      if (part.startsWith("`") && part.endsWith("`") && part.length > 2) return { kind: "code", text: part.slice(1, -1) };
      return { kind: "text", text: part };
    });
}
