import assert from "node:assert/strict";
import { test } from "node:test";
import {
  attentionCounts,
  collapseRoutine,
  interleave,
  knownAttentionItems,
  messageText,
  promptBefore
} from "../features/ai-team/conversation";
import { backoffMs, coalesce, createPoller, latestOnly, pollDelay, type Timers } from "../features/ai-team/polling";
import { createRunFeed, isNewerRun, parseInline, placeRuns, startSummary } from "../features/ai-team/runs";
import { employeeStatus, groupByState, lastSeenText, leadSummary, presenceDot } from "../features/ai-team/status";
import type { AttentionItem, Message, Proposal, Run, Task, TimelineEvent } from "../features/ai-team/types";

function task(patch: Partial<Task>): Task {
  return {
    project_id: "jabx",
    task_id: "t-1",
    title: "A task",
    state: "backlog",
    review_state: "none",
    employee_id: null,
    task_key: null,
    implementer: null,
    model: null,
    lane: null,
    current_attempt: null,
    attempts: [],
    stale: false,
    blocked_reason: null,
    next_action: null,
    integrated_commit: null,
    latest_review: null,
    created_at: null,
    updated_at: null,
    ...patch
  };
}

function message(id: string, at: string, patch: Partial<Message> = {}): Message {
  return { message_id: id, thread_id: "th", role: "jaber", body: id, created_at: at, proposal_id: null, status: "sent", ...patch };
}

function event(id: string, at: string, type = "task_assigned"): TimelineEvent {
  return { event_id: id, type, at, actor: null, summary: id };
}

function run(patch: Partial<Run> = {}): Run {
  return {
    run_id: "r-1",
    proposal_id: "p-1",
    project_id: "jabx",
    task_id: "t-1",
    employee_task: "cody.code_review",
    status: "running",
    attempt_id: null,
    queued_at: "2026-10-09T10:00:00Z",
    started_at: null,
    finished_at: null,
    last_heartbeat_at: null,
    activity: null,
    cause: null,
    report: null,
    ...patch
  };
}

// Fake timers: nothing fires until the test says so.
function fakeTimers() {
  const pending: { fn: () => void; ms: number; id: number }[] = [];
  let next = 0;
  const timers: Timers = {
    setTimeout: (fn, ms) => {
      const id = ++next;
      pending.push({ fn, ms, id });
      return id;
    },
    clearTimeout: (handle) => {
      const index = pending.findIndex((item) => item.id === handle);
      if (index >= 0) pending.splice(index, 1);
    }
  };
  return { timers, pending, fire: () => pending.shift()?.fn() };
}

const flush = () => new Promise((resolve) => setImmediate(resolve));

// --- Status derivation ---------------------------------------------------------------------

test("employee status: running beats review, review beats nothing", () => {
  const tasks = [
    task({ task_id: "a", employee_id: "cody", state: "needs_review", updated_at: "2026-10-09T09:00:00Z" }),
    task({ task_id: "b", employee_id: "cody", state: "running", updated_at: "2026-10-09T08:00:00Z", stale: true }),
    task({ task_id: "c", employee_id: "maya", state: "needs_review", updated_at: "2026-10-09T07:00:00Z" })
  ];
  const cody = employeeStatus("cody", tasks);
  assert.equal(cody.label, "Working");
  assert.equal(cody.task?.task_id, "b");
  assert.equal(cody.stale, true);
  assert.equal(cody.last_activity, "2026-10-09T09:00:00Z");
  assert.equal(employeeStatus("maya", tasks).label, "In review");
  assert.deepEqual(employeeStatus("wei", tasks), { status: "none", label: "No tracked activity", stale: false, task: null, last_activity: null });
});

test("Adam's card counts the team's open work and focuses review first", () => {
  const lead = leadSummary([
    task({ task_id: "a", state: "running" }),
    task({ task_id: "b", state: "needs_review" }),
    task({ task_id: "c", state: "failed" }),
    task({ task_id: "d", state: "blocked" }),
    task({ task_id: "e", state: "backlog" }),
    task({ task_id: "f", state: "accepted" })
  ]);
  assert.deepEqual([lead.running, lead.review, lead.failed, lead.waiting], [1, 1, 1, 2]);
  assert.equal(lead.focus?.task_id, "b");
});

test("the board groups by state in the fixed order, unknown states last", () => {
  const groups = groupByState([task({ task_id: "a", state: "accepted" }), task({ task_id: "b", state: "odd" }), task({ task_id: "c", state: "running" })]);
  assert.deepEqual(groups.map((g) => g.state), ["running", "accepted", "odd"]);
});

test("presence dot and last seen text", () => {
  assert.equal(presenceDot(null), null);
  assert.equal(presenceDot(true)?.className, "bg-success");
  assert.equal(presenceDot(false)?.className, "bg-muted-foreground");
  const now = Date.parse("2026-10-09T12:00:00Z");
  assert.equal(lastSeenText("2026-10-09T10:00:00Z", now), "Last seen 2 h ago.");
  assert.equal(lastSeenText(null, now), "Not seen yet.");
});

// --- Interleaving ----------------------------------------------------------------------------

test("messages and events interleave by time; ties keep events first", () => {
  const entries = interleave(
    [message("m1", "2026-10-09T10:00:00Z"), message("m2", "2026-10-09T10:05:00Z")],
    [event("e1", "2026-10-09T10:05:00Z"), event("e0", "2026-10-09T09:00:00Z")]
  );
  assert.deepEqual(
    entries.map((e) => (e.kind === "event" ? e.event.event_id : e.message.message_id)),
    ["e0", "m1", "e1", "m2"]
  );
});

test("routine events fold, alerts stay visible", () => {
  const rows = collapseRoutine(
    interleave([], [
      event("a", "2026-10-09T10:00:00Z"),
      event("b", "2026-10-09T10:01:00Z"),
      event("c", "2026-10-09T10:02:00Z", "attempt_failed"),
      event("d", "2026-10-09T10:03:00Z")
    ])
  );
  assert.deepEqual(rows.map((r) => r.kind), ["collapsed", "event", "event"]);
});

test("run cards sit after the rows queued before them", () => {
  const placed = placeRuns(["2026-10-09T09:00:00Z", "2026-10-09T11:00:00Z"], (row) => row, [run({ queued_at: "2026-10-09T10:00:00Z" })]);
  assert.deepEqual(placed.map((p) => p.kind), ["row", "run", "row"]);
});

test("a failed reply retries the message it answered; proposal blocks are hidden", () => {
  const messages = [message("m1", "1"), message("a1", "2", { role: "adam" }), message("m2", "3"), message("a2", "4", { role: "adam", status: "failed" })];
  assert.equal(promptBefore(messages, messages[3])?.message_id, "m2");
  assert.equal(messageText("Here.\n```proposal\n{}\n```"), "Here.");
});

test("attention counts every project; unknown kinds are skipped", () => {
  const proposal = { proposal_id: "p", project_id: "jabx", thread_id: "t" } as Proposal;
  const items = knownAttentionItems([
    { kind: "proposal", proposal },
    { kind: "run", run: run({ project_id: "dash" }) },
    { kind: "mystery" }
  ]) as AttentionItem[];
  assert.equal(items.length, 2);
  assert.deepEqual(attentionCounts(items, "jabx"), { total: 2, proposals: 1, replies: 1, outsideFilter: 1 });
});

test("reports render only bold and code", () => {
  assert.deepEqual(parseInline("a **b** `<c>` <script>"), [
    { kind: "text", text: "a " },
    { kind: "bold", text: "b", children: [{ kind: "text", text: "b" }] },
    { kind: "text", text: " " },
    { kind: "code", text: "<c>" },
    { kind: "text", text: " <script>" }
  ]);
});

test("the Start dialog names the independence rule for code reviews", () => {
  const summary = startSummary({ employee_task: "cody.code_review", project_id: "jabx", budget_minutes: 30, task_id: "t-1" } as Proposal);
  assert.equal(summary.who, "Cody · code review");
  assert.equal(summary.engine, "Codex, read-only");
  assert.match(summary.independence ?? "", /not written by Codex/);
});

// --- Polling ---------------------------------------------------------------------------------

test("poll delay: 5 s active, 15 s idle, 60 s hidden, doubling on errors up to 60 s", () => {
  assert.equal(pollDelay({ visible: true, active: true }), 5_000);
  assert.equal(pollDelay({ visible: true, active: false }), 15_000);
  assert.equal(pollDelay({ visible: false, active: true }), 60_000);
  assert.equal(pollDelay({ visible: true, active: true, failures: 1 }), 10_000);
  assert.equal(pollDelay({ visible: true, active: false, failures: 1 }), 30_000);
  assert.equal(pollDelay({ visible: true, active: false, failures: 5 }), 60_000);
  assert.equal(pollDelay({ visible: false, active: false, failures: 3 }), 60_000);
  assert.equal(backoffMs(5_000, 0), 5_000);
});

test("the poller never overlaps loads and backs off after failures", async () => {
  const { timers, pending, fire } = fakeTimers();
  let calls = 0;
  let inFlight = 0;
  let maxInFlight = 0;
  let fail = true;
  const poller = createPoller({
    timers,
    delay: (failures) => pollDelay({ visible: true, active: false, failures }),
    load: async () => {
      calls += 1;
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await flush();
      inFlight -= 1;
      if (fail) throw new Error("offline");
    }
  });
  const started = poller.start();
  void poller.poke();
  void poller.poke();
  await started;
  await flush();
  await flush();
  assert.equal(maxInFlight, 1);
  assert.equal(pending.length, 1);
  assert.ok(pending[0].ms >= 30_000, `backed off to ${pending[0].ms}`);
  fail = false;
  fire();
  await flush();
  await flush();
  assert.equal(pending.at(-1)?.ms, 15_000);
  assert.ok(calls >= 2);
  poller.stop();
  assert.equal(pending.length, 0);
});

test("only the newest load may apply its answer", () => {
  const loads = latestOnly();
  const first = loads.begin();
  const second = loads.begin();
  assert.equal(first(), false);
  assert.equal(second(), true);
  loads.invalidate();
  assert.equal(second(), false);
});

test("coalesce runs one at a time and once more after", async () => {
  let runs = 0;
  const go = coalesce(async () => {
    runs += 1;
    await flush();
    return runs;
  });
  const [a, b, c] = await Promise.all([go(), go(), go()]);
  assert.equal(a, 1);
  assert.equal(b, 2);
  assert.equal(c, 2);
});

test("a run poll that started before a cancel is ignored", async () => {
  const { timers } = fakeTimers();
  let release: (value: Run) => void = () => undefined;
  const seen: string[] = [];
  const feed = createRunFeed(run(), {
    timers,
    load: () => new Promise<Run>((resolve) => (release = resolve)),
    onRun: (next) => seen.push(next.status)
  });
  const polling = feed.start({ immediate: true });
  await feed.mutate(async () => run({ status: "cancel_requested" }));
  release(run({ status: "running", last_heartbeat_at: "2026-10-09T10:10:00Z" }));
  await polling;
  assert.deepEqual(seen, ["cancel_requested"]);
  assert.equal(isNewerRun(run({ status: "running" }), run({ status: "finished" })), false);
  feed.stop();
});
