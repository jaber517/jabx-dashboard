// Display rules for conversations and the attention strip, and the feed that keeps one
// conversation fresh. Ported from Jabx apps/dashboard/lib/client/conversation.ts.
import { backoffMs, coalesce, FAST_MS, HIDDEN_MS, isPageVisible, MAX_BACKOFF_MS, realTimers, type Timers } from "./polling";
import { errorText, mergeRuns } from "./runs";
import type { AttentionItem, Message, Run, Task, ThreadDetail, TimelineEvent } from "./types";

export type Entry = { kind: "event"; at: string; event: TimelineEvent } | { kind: "message"; at: string; message: Message };
export type Row = Entry | { kind: "collapsed"; key: string; events: TimelineEvent[] };

const time = (iso: string) => {
  const ms = Date.parse(iso);
  return Number.isFinite(ms) ? ms : null;
};

// Events and messages in time order. Equal or unreadable times keep their recorded order,
// with events first so a reply follows the event it is about.
export function interleave(messages: Message[], events: TimelineEvent[]): Entry[] {
  const entries: Entry[] = [
    ...events.map((event) => ({ kind: "event" as const, at: event.at, event })),
    ...messages.map((message) => ({ kind: "message" as const, at: message.created_at, message }))
  ];
  return entries
    .map((entry, index) => ({ entry, index, ms: time(entry.at) }))
    .sort((a, b) => (a.ms !== null && b.ms !== null && a.ms !== b.ms ? a.ms - b.ms : a.index - b.index))
    .map(({ entry }) => entry);
}

// Failures, blocks and cancellations always stay visible.
export function isAlertEvent(event: TimelineEvent) {
  return /fail|block|cancel|error|reject/i.test(event.type) || /^(failed|attempt failed)/i.test(event.summary);
}

// Two or more routine events in a row fold into one summary line.
export function collapseRoutine(entries: Entry[], minRun = 2): Row[] {
  const rows: Row[] = [];
  let run: TimelineEvent[] = [];
  const flush = () => {
    if (run.length >= minRun) rows.push({ kind: "collapsed", key: run[0].event_id, events: run });
    else for (const event of run) rows.push({ kind: "event", at: event.at, event });
    run = [];
  };
  for (const entry of entries) {
    if (entry.kind === "event" && !isAlertEvent(entry.event)) {
      run.push(entry.event);
      continue;
    }
    flush();
    rows.push(entry);
  }
  flush();
  return rows;
}

export const rowTime = (row: Row) => (row.kind === "collapsed" ? row.events[0].at : row.at);

export function eventLabel(type: string) {
  const words = type.replaceAll("_", " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export function collapsedSummary(events: TimelineEvent[]) {
  const kinds = Array.from(new Set(events.map((event) => eventLabel(event.type))));
  return `${events.length} updates · ${kinds.slice(0, 3).join(", ")}${kinds.length > 3 ? "…" : ""}`;
}

// Proposal cards travel in the message body as a fenced block; the card shows them instead.
export const messageText = (body: string) => body.replace(/```proposal\s*\n[\s\S]*?```/g, "").trim();

const itemProject = (item: AttentionItem) =>
  item.kind === "proposal" ? item.proposal.project_id : item.kind === "run" ? item.run.project_id : item.thread.project_id;

// The strip counts every project. The filter only says how many of them it is hiding below.
export function attentionCounts(items: AttentionItem[], projectFilter: string) {
  const proposals = items.filter((item) => item.kind === "proposal").length;
  return {
    total: items.length,
    proposals,
    replies: items.length - proposals,
    outsideFilter:
      projectFilter === "all"
        ? 0
        : items.filter((item) => itemProject(item) !== null && itemProject(item) !== projectFilter).length
  };
}

// Attention items the client knows how to show; anything else is skipped rather than crashing.
export function knownAttentionItems(items: unknown[]): AttentionItem[] {
  return items.filter((item): item is AttentionItem => {
    const value = item as Record<string, unknown>;
    if (value.kind === "proposal") return typeof value.proposal === "object" && value.proposal !== null;
    if (value.kind === "run") return typeof value.run === "object" && value.run !== null;
    if (value.kind === "reply") return typeof value.thread === "object" && value.thread !== null && typeof value.preview === "string";
    return false;
  });
}

const spoken = (body: string) => {
  const text = messageText(body).replace(/[*`_]/g, "").replace(/\s+/g, " ").trim();
  return text.length > 200 ? `${text.slice(0, 200)}…` : text;
};

// What a screen reader hears when Adam's replies arrive. Null when nothing new came from Adam.
export function replyAnnouncement(messages: Message[], known: Set<string>) {
  const fresh = messages.filter((m) => m.role === "adam" && !known.has(m.message_id));
  const last = fresh.at(-1);
  if (!last) return null;
  const more = fresh.length > 1 ? `${fresh.length} new replies from Adam. ` : "";
  if (last.status === "failed") return `${more}Adam could not reply: ${spoken(last.body)}`;
  return `${more}Adam replied: ${spoken(last.body)}${last.proposal_id ? " A proposal is attached." : ""}`;
}

// The Jaber message a failed Adam reply was answering: retrying resends it.
export function promptBefore(messages: Message[], failed: Message) {
  return messages
    .slice(0, messages.indexOf(failed))
    .filter((m) => m.role === "jaber")
    .at(-1);
}

// The task's runs as the conversation knows them: loading until the first answer, failed with
// the last good list kept (stale) when a refresh did not work.
export type RunsLoad = { state: "loading" | "ready" | "failed"; runs: Run[]; error: string };
export type ConversationState = { detail: ThreadDetail | null; error: string; runs: RunsLoad; failures: number };

export type ConversationApi = {
  thread: (id: string) => Promise<ThreadDetail>;
  runs: (projectId: string, taskId: string) => Promise<Run[]>;
};

// Loads a thread (and, for a task thread, its runs) and keeps it fresh: every 5 s while it is
// open and the page is visible, every 60 s while hidden, backing off after errors. Refreshes
// never overlap, each one waits for its runs before reporting, and nothing reports after stop().
export function createConversationFeed(
  threadId: string,
  {
    api,
    onState,
    timers = realTimers,
    intervalMs = () => (isPageVisible() ? FAST_MS : HIDDEN_MS),
    maxDelayMs = MAX_BACKOFF_MS
  }: {
    api: ConversationApi;
    onState: (state: ConversationState) => void;
    timers?: Timers;
    intervalMs?: () => number;
    maxDelayMs?: number;
  }
) {
  let live = true;
  let polling = false;
  let handle: unknown;
  let state: ConversationState = { detail: null, error: "", runs: { state: "loading", runs: [], error: "" }, failures: 0 };
  const set = (patch: Partial<ConversationState>) => {
    if (!live) return;
    state = { ...state, ...patch };
    onState(state);
  };

  async function load() {
    if (!live) return state;
    let detail: ThreadDetail;
    try {
      detail = await api.thread(threadId);
    } catch (error) {
      set({ error: errorText(error, "Could not load this conversation"), failures: state.failures + 1 });
      return state;
    }
    if (!live) return state;
    let runs = state.runs;
    const { kind, project_id, task_id } = detail.thread;
    if (kind === "task" && project_id && task_id) {
      try {
        const list = await api.runs(project_id, task_id);
        runs = { state: "ready", runs: mergeRuns(state.runs.runs, list), error: "" };
      } catch (error) {
        runs = { ...state.runs, state: "failed", error: errorText(error, "Could not load the runs") };
      }
    }
    set({ detail, error: "", runs, failures: 0 });
    return state;
  }

  const refresh = coalesce(load);
  const delay = () => backoffMs(intervalMs(), state.failures, maxDelayMs);
  async function tick() {
    if (!live) return;
    await refresh();
    timers.clearTimeout(handle);
    if (live && polling) handle = timers.setTimeout(() => void tick(), delay());
  }

  return {
    state: () => state,
    refresh,
    // Starts polling; resolves after the first load.
    start() {
      polling = true;
      return tick();
    },
    // Loads now and restarts the schedule (the page became visible again, or came back online).
    poke: () => tick(),
    // A run card learned something newer than the list (a poll or a cancel).
    updateRun(run: Run) {
      const runs = state.runs.runs;
      if (!runs.some((r) => r.run_id === run.run_id)) return;
      set({ runs: { ...state.runs, runs: mergeRuns(runs, runs.map((r) => (r.run_id === run.run_id ? run : r))) } });
    },
    stop() {
      live = false;
      polling = false;
      timers.clearTimeout(handle);
    }
  };
}

export const openTasksFor = (employeeId: string, tasks: Task[]) =>
  tasks.filter((task) => task.employee_id === employeeId && !["accepted", "cancelled"].includes(task.state));
