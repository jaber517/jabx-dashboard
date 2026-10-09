"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, Loader2, RotateCcw, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { action, teamApi, type Action } from "./api";
import {
  collapseRoutine,
  collapsedSummary,
  createConversationFeed,
  eventLabel,
  interleave,
  isAlertEvent,
  messageText,
  openTasksFor,
  promptBefore,
  replyAnnouncement,
  rowTime,
  type ConversationState
} from "./conversation";
import { ProposalBlock } from "./proposal";
import { RunBlock, RunsList } from "./run";
import { errorText, isFinalRun, placeRuns } from "./runs";
import { assigneeName, formatTime, nextStepLabel, stateLabel, stateTone } from "./status";
import { taskRef, type Employee, type Message, type OpenTarget, type Run, type Snapshot, type Task, type TimelineEvent } from "./types";
import { ErrorText, Field, Fields, InlineText, MutedText, NeedsMacBook, ToneBadge, useOffline } from "./ui";

export const ADAM_USAGE_NOTE = "Adam's replies use Jaber's Claude Pro allowance (Sonnet 5.5)";

// kind "run" opens the run's task conversation scrolled to that run's card.
export type PanelTarget =
  | OpenTarget
  | { kind: "thread"; thread_id: string; proposal_id?: string }
  | { kind: "run"; project_id: string; task_id: string; run_id: string };

type Outgoing = { local_id: string; body: string; action: Action<Message>; state: "sending" | "failed"; error: string };
type Tab = "conversation" | "details";
const TABS: Tab[] = ["conversation", "details"];

function TimelineEntry({ event }: { event: TimelineEvent }) {
  const alert = isAlertEvent(event);
  return (
    <div className="flex items-start gap-2 py-1 text-[13px] leading-5">
      <span className={cn("mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full", alert ? "bg-danger" : "bg-muted-foreground")} aria-hidden="true" />
      <span className={cn("min-w-0 flex-1", alert ? "text-danger" : "text-muted-foreground")}>
        <strong className="font-semibold">{eventLabel(event.type)}</strong> · {event.summary}
        {event.actor ? ` · ${event.actor}` : ""}
      </span>
      <time dateTime={event.at} className="shrink-0 text-muted-foreground">
        {formatTime(event.at)}
      </time>
    </div>
  );
}

function Bubble({ message, onRetry, retrying }: { message: Message; onRetry?: () => void; retrying?: boolean }) {
  const offline = useOffline();
  if (message.role === "system") {
    return (
      <div className="flex items-start gap-2 py-1 text-[13px] text-muted-foreground">
        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground" aria-hidden="true" />
        <span className="flex-1">{message.body}</span>
        <time dateTime={message.created_at}>{formatTime(message.created_at)}</time>
      </div>
    );
  }
  const failed = message.status === "failed";
  const mine = message.role === "jaber";
  return (
    <div
      className={cn(
        "grid max-w-[85%] gap-1 rounded-3xl border px-4 py-3",
        mine ? "justify-self-end border-primary/40 bg-primary/10" : "justify-self-start border-border bg-surface",
        failed && "border-danger/40"
      )}
    >
      <small className="text-xs font-semibold text-muted-foreground">
        {mine ? "You" : "Adam"} · {formatTime(message.created_at)}
      </small>
      <p className={cn("whitespace-pre-wrap break-words text-sm leading-6", failed && "text-danger")}>
        <InlineText text={messageText(message.body)} />
      </p>
      {failed && onRetry ? (
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" className="justify-self-start" onClick={onRetry} disabled={retrying || offline}>
            {retrying ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <RotateCcw className="h-4 w-4" aria-hidden="true" />}
            Retry
          </Button>
          <NeedsMacBook />
        </div>
      ) : null}
    </div>
  );
}

// Task fields and attempts: the Details tab of a task conversation.
function TaskDetails({ task, names }: { task: Task; names: Record<string, string> }) {
  return (
    <div className="grid gap-3">
      <Fields>
        <Field label="Assignee" value={assigneeName(task, names)} />
        <Field label="Task key" value={task.task_key} />
        <Field label="Engine" value={task.implementer} />
        <Field label="Lane" value={task.lane} />
        <Field label="Requested model" value={task.model} />
        <Field label="Next step" value={nextStepLabel(task.next_action)} />
        {task.blocked_reason ? <Field label="Blocked" value={task.blocked_reason} /> : null}
        {task.latest_review ? (
          <Field
            label="Review"
            value={`${task.latest_review.verdict.replaceAll("_", " ")} by ${task.latest_review.reviewer} (${task.latest_review.findings} findings)`}
          />
        ) : null}
        {task.integrated_commit ? <Field label="Commit" value={task.integrated_commit} /> : null}
        <Field label="Created" value={formatTime(task.created_at)} />
        <Field label="Updated" value={formatTime(task.updated_at)} />
      </Fields>
      <h3 className="text-sm font-bold">
        Attempts <span className="font-semibold text-muted-foreground">{task.attempts.length}</span>
      </h3>
      {task.attempts.length === 0 ? <MutedText>No attempts yet.</MutedText> : null}
      {[...task.attempts].reverse().map((attempt) => (
        <div key={attempt.id} className="rounded-2xl border border-border p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <small className="break-all text-[13px] text-muted-foreground">{attempt.id}</small>
            <ToneBadge tone={attempt.status === "running" ? "working" : attempt.status === "completed" ? "done" : "blocked"}>
              {attempt.status}
            </ToneBadge>
          </div>
          <Fields>
            <Field label="Lane" value={attempt.lane} />
            <Field label="Model" value={attempt.model ? `${attempt.model} (reported by relay, unconfirmed)` : "unconfirmed"} />
            <Field label="Started" value={formatTime(attempt.started_at)} />
            <Field label="Finished" value={formatTime(attempt.finished_at)} />
            {attempt.relay_status ? <Field label="Relay" value={`${attempt.relay_status}, exit ${attempt.exit_code ?? "—"}`} /> : null}
            <Field label="Result" value={attempt.result_path ? <span className="break-all">{attempt.result_path}</span> : null} />
          </Fields>
        </div>
      ))}
    </div>
  );
}

function Slot({ focus, children }: { focus: boolean; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (focus) ref.current?.scrollIntoView({ block: "start" });
  }, [focus]);
  return <div ref={ref}>{children}</div>;
}

// Adam thread, person threads and task threads: messages and task timeline events
// interleaved, proposal and run cards in place, and a composer (Enter sends, Shift+Enter
// adds a line). Full screen on a phone, a side panel on desktop.
export function ConversationSheet({
  target,
  data,
  employees,
  pokeKey,
  onClose,
  onOpen,
  onChanged
}: {
  target: PanelTarget;
  data: Snapshot | null;
  employees: Employee[];
  /** Changes when the page becomes visible again or the laptop comes back: load now. */
  pokeKey: number;
  onClose: () => void;
  onOpen: (target: PanelTarget) => void;
  onChanged: () => void;
}) {
  const offline = useOffline();
  const [threadId, setThreadId] = useState<string | null>(target.kind === "thread" ? target.thread_id : null);
  const [feed, setFeed] = useState<ConversationState | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("conversation");
  const [draft, setDraft] = useState("");
  const [outgoing, setOutgoing] = useState<Outgoing[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [retrying, setRetrying] = useState<string | null>(null);
  const [newBelow, setNewBelow] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  // Actions behind messages sent from this panel, so a failed reply is retried with the same request_id.
  const sentActions = useRef(new Map<string, Action<Message>>());
  const closeRef = useRef<HTMLButtonElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const feedRef = useRef<ReturnType<typeof createConversationFeed> | null>(null);
  const changed = useRef(onChanged);
  changed.current = onChanged;
  const live = useRef(true);
  const ids = useId();
  const tasks = useMemo(() => data?.tasks ?? [], [data]);
  const names = useMemo(() => Object.fromEntries(employees.map((e) => [e.id, e.name])), [employees]);
  const focusProposal = target.kind === "thread" ? target.proposal_id : undefined;
  const focusRun = target.kind === "run" ? target.run_id : undefined;

  useEffect(() => {
    live.current = true;
    closeRef.current?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape" && !document.querySelector('[role="dialog"][aria-modal="true"]:not([data-conversation])')) onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      live.current = false;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  // Resolve the target to a thread: open (find or create) unless we already have its id.
  const [openAttempt, setOpenAttempt] = useState(0);
  useEffect(() => {
    if (target.kind === "thread") {
      setThreadId(target.thread_id);
      return;
    }
    let current = true;
    setThreadId(null);
    setFeed(null);
    setError("");
    const open: OpenTarget =
      target.kind === "run" ? { kind: "task", project_id: target.project_id, task_id: target.task_id } : target;
    teamApi.openThread(open).then(
      (thread) => {
        if (current) setThreadId(thread.thread_id);
      },
      (e: unknown) => {
        if (current) setError(errorText(e, "Could not open this conversation"));
      }
    );
    return () => {
      current = false;
    };
  }, [target, openAttempt]);

  // One feed per thread: every 5 s while open and visible, 60 s while hidden, backing off
  // after errors, and never reporting after the panel closes.
  useEffect(() => {
    if (!threadId) return;
    const current = createConversationFeed(threadId, { api: teamApi, onState: setFeed });
    feedRef.current = current;
    let open = true;
    void current.start().then(() => {
      if (open) changed.current();
    });
    return () => {
      open = false;
      current.stop();
      feedRef.current = null;
    };
  }, [threadId]);

  useEffect(() => {
    if (pokeKey === 0) return;
    if (feedRef.current) void feedRef.current.poke();
    else if (target.kind !== "thread") setOpenAttempt((n) => n + 1);
  }, [pokeKey, target.kind]);

  const refresh = useCallback(async () => {
    await feedRef.current?.refresh();
  }, []);

  const detail = feed?.detail ?? null;
  const runs = feed?.runs ?? { state: "loading" as const, runs: [], error: "" };
  const loadError = feed?.error ?? "";

  // Announce Adam's new replies, not what was already there when the panel opened.
  const known = useRef<Set<string> | null>(null);
  useEffect(() => {
    if (!detail) return;
    if (known.current) {
      const said = replyAnnouncement(detail.messages, known.current);
      if (said) setAnnouncement(said);
    }
    known.current = new Set(detail.messages.map((m) => m.message_id));
  }, [detail]);

  // Stay pinned to the newest message unless Jaber has scrolled up to read; then say that
  // new messages are below instead of jumping.
  const messageCount = (detail?.messages.length ?? 0) + outgoing.length;
  const pinned = useRef(!(focusProposal || focusRun));
  const seenCount = useRef<number | null>(null);
  useEffect(() => {
    const box = scrollRef.current;
    if (!box || !detail) return;
    if (pinned.current) {
      box.scrollTo({ top: box.scrollHeight });
      seenCount.current = messageCount;
    } else if (seenCount.current === null) {
      seenCount.current = messageCount;
    } else if (messageCount > seenCount.current) {
      setNewBelow(true);
    }
  }, [messageCount, tab, detail]);
  function onScroll() {
    const box = scrollRef.current;
    if (!box) return;
    pinned.current = box.scrollHeight - box.scrollTop - box.clientHeight < 48;
    if (pinned.current) {
      seenCount.current = messageCount;
      setNewBelow(false);
    }
  }
  function toNewest() {
    pinned.current = true;
    seenCount.current = messageCount;
    setNewBelow(false);
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }

  function selectTab(name: Tab, focus = false) {
    if (name !== tab) pinned.current = true;
    setTab(name);
    if (focus) document.getElementById(`${ids}-tab-${name}`)?.focus();
  }
  function onTabKey(event: React.KeyboardEvent) {
    const index = TABS.indexOf(tab);
    const next =
      event.key === "ArrowRight"
        ? TABS[(index + 1) % TABS.length]
        : event.key === "ArrowLeft"
          ? TABS[(index - 1 + TABS.length) % TABS.length]
          : null;
    if (!next) return;
    event.preventDefault();
    selectTab(next, true);
  }

  // A run card learned something newer than the list: keep the list in step, and refresh
  // the board when a run ends.
  const onRunChanged = useCallback((next: Run, previous: Run) => {
    feedRef.current?.updateRun(next);
    if (next.status !== previous.status && isFinalRun(next.status)) changed.current();
  }, []);
  const onRunAcknowledged = useCallback(() => changed.current(), []);
  const onDecided = useCallback(() => {
    void refresh();
    changed.current();
  }, [refresh]);

  const thread = detail?.thread ?? null;
  const task: Task | null =
    thread?.kind === "task" ? (tasks.find((t) => t.project_id === thread.project_id && t.task_id === thread.task_id) ?? null) : null;
  const person = thread?.kind === "person" ? (employees.find((e) => e.id === thread.employee_id) ?? null) : null;
  const fallbackTitle =
    target.kind === "person" ? names[target.employee_id] : target.kind === "task" || target.kind === "run" ? target.task_id : "Adam";

  async function deliver(item: Outgoing) {
    setOutgoing((list) => list.map((o) => (o.local_id === item.local_id ? { ...o, state: "sending", error: "" } : o)));
    try {
      const sent = await item.action.run();
      sentActions.current.set(sent.message_id, item.action);
      if (!live.current) return;
      setOutgoing((list) => list.filter((o) => o.local_id !== item.local_id));
      await refresh();
      if (live.current) changed.current();
    } catch (e) {
      const reason = errorText(e, "The message was not sent");
      if (live.current) {
        setOutgoing((list) => list.map((o) => (o.local_id === item.local_id ? { ...o, state: "failed", error: reason } : o)));
      }
    }
  }

  function send() {
    const body = draft.trim();
    if (!body || !threadId || offline || outgoing.some((o) => o.state === "sending")) return;
    const id = threadId;
    const item: Outgoing = {
      local_id: crypto.randomUUID(),
      body,
      state: "sending",
      error: "",
      action: action((request_id) => teamApi.sendMessage(id, body, request_id))
    };
    setDraft("");
    pinned.current = true;
    setOutgoing((list) => [...list, item]);
    void deliver(item);
  }

  // Adam's reply failed: resend the message it answered, with that message's request_id when we have it.
  async function retryReply(failed: Message) {
    if (!detail || !threadId) return;
    const prompt = promptBefore(detail.messages, failed);
    if (!prompt) return;
    const id = threadId;
    const retry = sentActions.current.get(prompt.message_id) ?? action((request_id) => teamApi.sendMessage(id, prompt.body, request_id));
    sentActions.current.set(prompt.message_id, retry);
    setRetrying(failed.message_id);
    try {
      await retry.run();
      await refresh();
    } catch (e) {
      if (live.current) setError(errorText(e, "The retry was not sent"));
    } finally {
      if (live.current) setRetrying(null);
    }
  }

  const rows = useMemo(() => collapseRoutine(interleave(detail?.messages ?? [], detail?.events ?? [])), [detail]);
  const placed = useMemo(() => placeRuns(rows, rowTime, runs.runs), [rows, runs.runs]);
  const lastFailed = detail?.messages.filter((m) => m.status === "failed").at(-1)?.message_id;
  const sending = outgoing.some((o) => o.state === "sending");
  const tabbed = thread?.kind === "task";
  const shownError = offline ? "" : error || loadError;

  return (
    <>
      <div className="fixed inset-0 z-50 hidden bg-[#07111B]/70 lg:block" onClick={onClose} aria-hidden="true" />
      <aside
        data-conversation
        role="dialog"
        aria-modal="true"
        aria-label={`Conversation: ${thread?.title ?? fallbackTitle}`}
        className="fixed inset-0 z-50 flex flex-col bg-background pt-[env(safe-area-inset-top)] lg:inset-y-0 lg:left-auto lg:right-0 lg:w-[520px] lg:border-l lg:border-border lg:bg-surface lg:pt-0"
      >
        <p className="sr-only" role="status">
          {announcement}
        </p>
        <div className="grid gap-3 border-b border-border px-4 pb-3 pt-3 lg:px-6 lg:pt-5">
          <div className="flex items-start gap-2">
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label="Close conversation"
              className="-ml-2 flex h-11 shrink-0 items-center gap-1 rounded-2xl px-2 text-sm font-semibold text-primary lg:order-last lg:ml-auto lg:w-11 lg:justify-center lg:text-muted-foreground"
            >
              <ChevronLeft className="h-5 w-5 lg:hidden" aria-hidden="true" />
              <span className="lg:hidden">AI Team</span>
              <X className="hidden h-5 w-5 lg:block" aria-hidden="true" />
            </button>
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-muted-foreground">
              {thread?.kind === "task" ? `${thread.project_id} · ${thread.task_id}` : thread?.kind === "person" ? "Person" : "Team thread"}
            </p>
            <h2 className="mt-0.5 text-xl font-bold">{thread?.title ?? fallbackTitle}</h2>
          </div>
          {task ? (
            <div className="flex flex-wrap gap-2">
              <ToneBadge tone={stateTone(task.state)}>{stateLabel(task.state)}</ToneBadge>
              <ToneBadge>{assigneeName(task, names)}</ToneBadge>
              {task.stale ? <ToneBadge tone="waiting">stale</ToneBadge> : null}
            </div>
          ) : null}
          {tabbed ? (
            <div className="flex gap-1" role="tablist" aria-label="Task views" onKeyDown={onTabKey}>
              {TABS.map((name) => (
                <button
                  key={name}
                  id={`${ids}-tab-${name}`}
                  type="button"
                  role="tab"
                  aria-selected={tab === name}
                  aria-controls={`${ids}-panel`}
                  tabIndex={tab === name ? 0 : -1}
                  className={cn(
                    "h-11 rounded-2xl px-4 text-sm font-semibold",
                    tab === name ? "bg-muted text-primary" : "text-muted-foreground hover:bg-muted/60"
                  )}
                  onClick={() => selectTab(name)}
                >
                  {name === "conversation" ? "Conversation" : "Details"}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div
          ref={scrollRef}
          onScroll={onScroll}
          className="relative flex-1 overflow-y-auto px-4 py-4 lg:px-6"
          {...(tabbed ? { id: `${ids}-panel`, role: "tabpanel", "aria-labelledby": `${ids}-tab-${tab}`, tabIndex: 0 } : {})}
        >
          <div className="grid gap-3">
            {shownError ? (
              <div className="flex flex-wrap items-center gap-2">
                <ErrorText>
                  {shownError}
                  {loadError && !error ? ". Trying again automatically." : ""}
                </ErrorText>
                {loadError && !error ? (
                  <Button variant="ghost" onClick={() => void refresh()}>
                    <RotateCcw className="h-4 w-4" aria-hidden="true" />
                    Retry now
                  </Button>
                ) : null}
              </div>
            ) : null}
            {offline && !detail ? <MutedText>This conversation has not loaded yet. It will when your MacBook is back.</MutedText> : null}
            {thread?.kind === "adam" ? (
              <MutedText>Planning and decisions for the whole team. Requests for new work come back as proposals.</MutedText>
            ) : null}
            {person ? (
              <>
                <MutedText>
                  Adam answers about {person.name.split(" ")[0]}’s work for now; direct chat with {person.name.split(" ")[0]} comes later.
                </MutedText>
                {openTasksFor(person.id, tasks).map((t) => (
                  <button
                    key={taskRef(t)}
                    type="button"
                    className="flex min-h-12 items-center justify-between gap-3 rounded-2xl border border-border px-3 py-2 text-left hover:bg-muted/60"
                    onClick={() => onOpen({ kind: "task", project_id: t.project_id, task_id: t.task_id })}
                  >
                    <span className="grid">
                      <span className="text-[13px] text-muted-foreground">
                        {stateLabel(t.state)} · {t.project_id}
                      </span>
                      <span className="text-sm font-semibold">{t.title}</span>
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  </button>
                ))}
              </>
            ) : null}
            {tab === "details" && task ? <TaskDetails task={task} names={names} /> : null}
            {tab === "details" && thread?.kind === "task" ? (
              <RunsList
                runs={runs.runs}
                state={runs.state}
                error={runs.error}
                onRetry={() => void refresh()}
                onChanged={onRunChanged}
                onAcknowledged={onRunAcknowledged}
              />
            ) : null}
            {tab === "details" && !task && thread ? <MutedText>This task is not in the current snapshot.</MutedText> : null}
            {tab === "conversation" && !detail && !shownError && !offline ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-label="Loading conversation" />
            ) : null}
            {tab === "conversation" && detail ? (
              <>
                {thread?.kind === "task" && runs.state === "failed" && !offline ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <ErrorText>
                      Could not load this task’s runs ({runs.error}){runs.runs.length ? "; the cards below may be out of date" : ""}.
                    </ErrorText>
                    <Button variant="ghost" onClick={() => void refresh()}>
                      <RotateCcw className="h-4 w-4" aria-hidden="true" />
                      Retry
                    </Button>
                  </div>
                ) : null}
                {placed.length === 0 && outgoing.length === 0 ? (
                  <MutedText>No messages yet. Ask Adam anything about this {thread?.kind === "task" ? "task" : "work"}.</MutedText>
                ) : null}
                {placed.map((item) => {
                  if (item.kind === "run") {
                    return (
                      <Slot key={`run:${item.run.run_id}`} focus={focusRun === item.run.run_id}>
                        <RunBlock run={item.run} onChanged={onRunChanged} onAcknowledged={onRunAcknowledged} />
                      </Slot>
                    );
                  }
                  const { row } = item;
                  if (row.kind === "event") return <TimelineEntry key={row.event.event_id} event={row.event} />;
                  if (row.kind === "collapsed") {
                    const open = expanded.has(row.key);
                    return (
                      <div key={row.key}>
                        <button
                          type="button"
                          className="flex min-h-11 w-full items-center gap-2 text-left text-[13px] text-muted-foreground"
                          aria-expanded={open}
                          onClick={() =>
                            setExpanded((set) => {
                              const next = new Set(set);
                              if (open) next.delete(row.key);
                              else next.add(row.key);
                              return next;
                            })
                          }
                        >
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground" aria-hidden="true" />
                          <span className="flex-1">{open ? "Hide updates" : collapsedSummary(row.events)}</span>
                          <ChevronRight className={cn("h-4 w-4 transition-transform", open && "rotate-90")} aria-hidden="true" />
                        </button>
                        {open ? row.events.map((event) => <TimelineEntry key={event.event_id} event={event} />) : null}
                      </div>
                    );
                  }
                  const { message } = row;
                  return (
                    <div key={message.message_id} className="grid gap-3">
                      <Bubble
                        message={message}
                        retrying={retrying === message.message_id}
                        onRetry={message.message_id === lastFailed ? () => void retryReply(message) : undefined}
                      />
                      {message.proposal_id ? (
                        <Slot focus={focusProposal === message.proposal_id}>
                          <ProposalBlock proposalId={message.proposal_id} reloadKey={detail.messages.length} onDecided={onDecided} />
                        </Slot>
                      ) : null}
                    </div>
                  );
                })}
                {outgoing.map((item) => (
                  <div key={item.local_id} className="grid max-w-[85%] gap-1 justify-self-end rounded-3xl border border-primary/40 bg-primary/10 px-4 py-3">
                    <small className="text-xs font-semibold text-muted-foreground">
                      You · {item.state === "sending" ? "sending…" : "not sent"}
                    </small>
                    <p className="whitespace-pre-wrap break-words text-sm leading-6">{item.body}</p>
                    {item.state === "failed" ? (
                      <>
                        <ErrorText>{item.error}</ErrorText>
                        <Button variant="secondary" className="justify-self-start" disabled={offline} onClick={() => void deliver(item)}>
                          <RotateCcw className="h-4 w-4" aria-hidden="true" />
                          Retry
                        </Button>
                      </>
                    ) : null}
                  </div>
                ))}
                {thread?.pending_reply ? (
                  <p className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Adam is replying…
                  </p>
                ) : null}
              </>
            ) : null}
          </div>
          {tab === "conversation" && newBelow ? (
            <Button variant="secondary" className="sticky bottom-2 left-full mt-2 bg-surface" onClick={toNewest}>
              <ChevronDown className="h-4 w-4" aria-hidden="true" />
              New messages
            </Button>
          ) : null}
        </div>

        {tab === "conversation" ? (
          <form
            className="grid gap-2 border-t border-border bg-surface px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 lg:px-6 lg:pb-4"
            onSubmit={(event) => {
              event.preventDefault();
              send();
            }}
          >
            <label htmlFor={`${ids}-composer`} className="text-[13px] font-semibold text-muted-foreground">
              To: Adam
            </label>
            <div className="flex items-end gap-2">
              <Textarea
                id={`${ids}-composer`}
                rows={2}
                className="min-h-[2.75rem] flex-1 resize-none"
                value={draft}
                disabled={!threadId || sending || offline}
                placeholder={offline ? "Needs your MacBook" : thread?.kind === "task" ? "Ask about this task…" : "Write to Adam…"}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                    event.preventDefault();
                    send();
                  }
                }}
              />
              <Button type="submit" disabled={!threadId || sending || offline || !draft.trim()}>
                {sending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Send className="h-4 w-4" aria-hidden="true" />}
                Send
              </Button>
            </div>
            <NeedsMacBook />
            <small className="text-xs text-muted-foreground">{ADAM_USAGE_NOTE}</small>
          </form>
        ) : null}
      </aside>
    </>
  );
}
