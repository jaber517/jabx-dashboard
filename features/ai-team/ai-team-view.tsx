"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, ChevronRight, Clock, FileText, ListFilter, MessageSquare, PauseCircle, X } from "lucide-react";
import { MacbookOffline } from "@/components/icons/macbook-offline";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { isOfflineError, teamApi } from "./api";
import { attentionCounts, knownAttentionItems } from "./conversation";
import { ConversationSheet, type PanelTarget } from "./conversation-sheet";
import { createPoller, isPageVisible, latestOnly, pollDelay } from "./polling";
import { useTeamPresence } from "./presence";
import { describeTask, RUN_STATUS } from "./runs";
import { assigneeName, employeeStatus, formatAge, groupByState, lastSeenText, leadSummary, stateLabel, stateTone } from "./status";
import { StepUpProvider } from "./step-up-sheet";
import { taskRef, type AttentionItem, type Employee, type RunnerStatus, type Snapshot, type Task, type Thread } from "./types";
import { ErrorText, LEAD_ID, MutedText, OfflineProvider, Portrait, teamEmployees, ToneBadge } from "./ui";

type Board = { snapshot: Snapshot; attention: AttentionItem[]; threads: Thread[]; receivedAt: number };

// The last board that loaded, kept for this visit so returning to the tab (or losing the
// laptop) still shows it. Never written to storage.
let lastBoard: Board | null = null;

function clockTime(ms: number) {
  return new Date(ms).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

// --- Offline ------------------------------------------------------------------------------
function OfflineHeader({ lastSeenAt, now }: { lastSeenAt: string | null; now: number }) {
  return (
    <section aria-label="AI team offline" className="flex flex-col items-center gap-4 rounded-3xl border border-border bg-surface px-5 py-8 text-center">
      <div className="rounded-3xl bg-[#07111B] p-4">
        <MacbookOffline size={120} title="MacBook disconnected" />
      </div>
      <div className="grid gap-1.5">
        <h2 className="text-xl font-bold">Your AI team is offline</h2>
        <p className="text-[15px] leading-6 text-muted-foreground">
          Your MacBook is off or asleep. {lastSeenText(lastSeenAt, now)}
        </p>
        <p className="text-[15px] leading-6 text-muted-foreground">Tasks, projects and resources still work.</p>
      </div>
    </section>
  );
}

// --- Needs your attention -------------------------------------------------------------------
// Proposals awaiting a decision, unread replies from Adam and runs that failed or need
// attention, across every project. The project filter never hides anything here.
function AttentionStrip({ items, projectFilter, onOpen }: { items: AttentionItem[]; projectFilter: string; onOpen: (target: PanelTarget) => void }) {
  if (items.length === 0) return null;
  const counts = attentionCounts(items, projectFilter);
  const chip = "flex min-h-14 w-full items-start gap-3 rounded-2xl border border-border bg-surface px-3 py-2.5 text-left hover:border-primary sm:w-72";
  return (
    <section aria-label="Needs your attention" className="grid gap-3">
      <h2 className="text-lg font-bold">
        Needs your attention <span className="font-semibold text-muted-foreground">{counts.total}</span>
      </h2>
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {items.map((item) =>
          item.kind === "proposal" ? (
            <button
              key={`p:${item.proposal.proposal_id}`}
              type="button"
              className={chip}
              onClick={() => onOpen({ kind: "thread", thread_id: item.proposal.thread_id, proposal_id: item.proposal.proposal_id })}
            >
              <FileText className="mt-0.5 h-4 w-4 shrink-0 text-tone-amber" aria-hidden="true" />
              <span className="grid min-w-0">
                <span className="text-[13px] text-muted-foreground">Proposal · {item.proposal.project_id}</span>
                <span className="truncate text-sm font-semibold">{item.proposal.title}</span>
              </span>
            </button>
          ) : item.kind === "run" ? (
            // A failed or needs-attention run opens its task conversation at the run's card.
            <button
              key={`run:${item.run.run_id}`}
              type="button"
              className={cn(chip, "border-danger/40")}
              onClick={() => onOpen({ kind: "run", project_id: item.run.project_id, task_id: item.run.task_id, run_id: item.run.run_id })}
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-danger" aria-hidden="true" />
              <span className="grid min-w-0">
                <span className="text-[13px] text-muted-foreground">
                  Run {RUN_STATUS[item.run.status]?.label.toLowerCase() ?? item.run.status} · {describeTask(item.run.employee_task).who} ·{" "}
                  {item.run.project_id}
                </span>
                <span className="truncate text-sm font-semibold">{item.run.cause ?? item.run.task_id}</span>
              </span>
            </button>
          ) : (
            <button
              key={`r:${item.thread.thread_id}`}
              type="button"
              className={chip}
              onClick={() => onOpen({ kind: "thread", thread_id: item.thread.thread_id })}
            >
              <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <span className="grid min-w-0">
                <span className="text-[13px] text-muted-foreground">Reply from Adam · {item.thread.project_id ?? item.thread.title}</span>
                <span className="truncate text-sm font-semibold">{item.preview}</span>
              </span>
            </button>
          )
        )}
      </div>
      {counts.outsideFilter > 0 ? (
        <MutedText>
          {counts.outsideFilter} of these {counts.outsideFilter === 1 ? "is" : "are"} outside {projectFilter}.
        </MutedText>
      ) : null}
    </section>
  );
}

// --- Employee cards -------------------------------------------------------------------------
function CurrentTask({ label, task, onOpen }: { label: string; task: Task; onOpen: (task: Task) => void }) {
  return (
    <button
      type="button"
      className="flex min-h-12 w-full items-center justify-between gap-3 rounded-2xl border border-border px-3 py-2 text-left hover:bg-muted/60"
      onClick={() => onOpen(task)}
    >
      <span className="grid min-w-0">
        <span className="text-[13px] text-muted-foreground">
          {label} · {task.project_id}
        </span>
        <span className="truncate text-sm font-semibold">{task.title}</span>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
    </button>
  );
}

function CardHead({ employee }: { employee: Employee }) {
  return (
    <div className="flex items-center gap-3">
      <Portrait employee={employee} size={56} />
      <div className="min-w-0">
        <h3 className="text-[17px] font-bold">{employee.name}</h3>
        <p className="text-sm text-muted-foreground">{employee.role}</p>
      </div>
    </div>
  );
}

function ChatButton({ employee, onChat }: { employee: Employee; onChat: (employeeId: string) => void }) {
  return (
    <Button variant="ghost" onClick={() => onChat(employee.id)} aria-label={`Chat about ${employee.name}`}>
      <MessageSquare className="h-4 w-4" aria-hidden="true" />
      Chat
    </Button>
  );
}

function LeadCard({ employee, tasks, now, onOpen, onChat }: {
  employee: Employee; tasks: Task[]; now: number; onOpen: (task: Task) => void; onChat: (employeeId: string) => void;
}) {
  const lead = leadSummary(tasks);
  const open = lead.running + lead.review + lead.failed + lead.waiting;
  const last = tasks.reduce<string | null>((at, task) => (!at || (task.updated_at && task.updated_at > at) ? task.updated_at : at), null);
  const counts: [number, string][] = [
    [lead.running, "running"],
    [lead.review, "to review"],
    [lead.failed, "failed"],
    [lead.waiting, "waiting"]
  ];
  return (
    <Card className="flex flex-col gap-4 p-5 sm:p-5" aria-label={`${employee.name}, coordinator`}>
      <CardHead employee={employee} />
      <div className="flex flex-wrap gap-2">
        <ToneBadge tone={open ? "working" : "neutral"}>{open ? "Coordinating" : "No open tasks"}</ToneBadge>
      </div>
      <dl className="grid grid-cols-4 gap-2 text-center">
        {counts.map(([value, label]) => (
          <div key={label} className="rounded-2xl bg-muted px-1 py-2">
            <dd className="text-lg font-bold tabular-nums">{value}</dd>
            <dt className="text-xs text-muted-foreground">{label}</dt>
          </div>
        ))}
      </dl>
      {lead.focus ? (
        <CurrentTask label={lead.focus.state === "needs_review" ? "Next to review" : "Watching"} task={lead.focus} onOpen={onOpen} />
      ) : (
        <MutedText>Nothing waiting on Adam</MutedText>
      )}
      <div className="mt-auto flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
          <Clock className="h-3.5 w-3.5" aria-hidden="true" />
          Team activity {last ? formatAge(last, now) : "none recorded"}
        </span>
        <ChatButton employee={employee} onChat={onChat} />
      </div>
    </Card>
  );
}

function EmployeeCard({ employee, tasks, now, onOpen, onShowTasks, onChat, active }: {
  employee: Employee; tasks: Task[]; now: number; onOpen: (task: Task) => void;
  onShowTasks: (employeeId: string) => void; onChat: (employeeId: string) => void; active: boolean;
}) {
  if (employee.id === LEAD_ID) return <LeadCard employee={employee} tasks={tasks} now={now} onOpen={onOpen} onChat={onChat} />;
  const status = employeeStatus(employee.id, tasks);
  const tone = status.status === "working" ? "working" : status.status === "in_review" ? "review" : "neutral";
  const count = tasks.filter((task) => task.employee_id === employee.id).length;
  return (
    <Card className={cn("flex flex-col gap-4 p-5 sm:p-5", active && "border-primary")} aria-label={employee.name}>
      <CardHead employee={employee} />
      <div className="flex flex-wrap gap-2">
        <ToneBadge tone={tone}>{status.label}</ToneBadge>
        {status.stale ? <ToneBadge tone="waiting">stale</ToneBadge> : null}
      </div>
      {status.task ? <CurrentTask label="Current task" task={status.task} onOpen={onOpen} /> : <MutedText>No current task</MutedText>}
      <div className="mt-auto grid gap-1">
        <span className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
          <Clock className="h-3.5 w-3.5" aria-hidden="true" />
          Last activity {status.last_activity ? formatAge(status.last_activity, now) : "none recorded"}
        </span>
        <div className="-ml-3 flex flex-wrap gap-1">
          <Button variant="ghost" onClick={() => onShowTasks(employee.id)} disabled={count === 0} aria-pressed={active}>
            <ListFilter className="h-4 w-4" aria-hidden="true" />
            {count === 0 ? "No tasks yet" : active ? "Showing tasks" : `View tasks (${count})`}
          </Button>
          <ChatButton employee={employee} onChat={onChat} />
        </div>
      </div>
    </Card>
  );
}

// --- Task board -----------------------------------------------------------------------------
function TaskRow({ task, names, selected, onOpen }: { task: Task; names: Record<string, string>; selected: boolean; onOpen: (task: Task) => void }) {
  return (
    <button
      type="button"
      className={cn(
        "flex min-h-14 w-full items-center justify-between gap-3 px-4 py-2.5 text-left hover:bg-muted/60",
        selected && "bg-muted"
      )}
      onClick={() => onOpen(task)}
    >
      <span className="grid min-w-0">
        <span className="text-sm font-semibold">{task.title}</span>
        <span className="truncate text-[13px] text-muted-foreground">
          {task.project_id} · {task.task_id}
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-2">
        <span className={cn("text-[13px]", task.employee_id ? "text-foreground" : "text-muted-foreground")}>{assigneeName(task, names)}</span>
        {task.stale ? <ToneBadge tone="waiting">stale</ToneBadge> : null}
      </span>
    </button>
  );
}

// --- The tab --------------------------------------------------------------------------------
export function AiTeamView() {
  const presence = useTeamPresence();
  const [board, setBoard] = useState<Board | null>(lastBoard);
  const [runner, setRunner] = useState<RunnerStatus | null>(null);
  const [error, setError] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const [filter, setFilter] = useState("all");
  const [person, setPerson] = useState<string | null>(null);
  const [panel, setPanel] = useState<PanelTarget | null>(null);
  const [pokeKey, setPokeKey] = useState(0);
  const tasksRef = useRef<HTMLElement>(null);
  const loads = useRef(latestOnly());
  const offline = presence.online === false;

  // Fast polling while a conversation is open or something is moving.
  const active = !!panel || !!board?.threads.some((t) => t.pending_reply) || !!board?.snapshot.tasks.some((t) => t.state === "running");
  const activeRef = useRef(active);
  activeRef.current = active;

  // Snapshot, attention and thread list refresh together; the last good data stays on error.
  const load = useCallback(async () => {
    const current = loads.current.begin();
    try {
      const [snapshot, attention, threads] = await Promise.all([teamApi.snapshot(), teamApi.attention(), teamApi.threads()]);
      if (!current()) return;
      const next: Board = { snapshot, attention: knownAttentionItems(attention.items), threads, receivedAt: Date.now() };
      lastBoard = next;
      setBoard(next);
      setError("");
      // Runner status is separate so the board still loads if the runner route is down.
      teamApi.runner().then(setRunner, () => setRunner(null));
    } catch (e) {
      if (current() && !isOfflineError(e)) setError(e instanceof Error ? e.message : "Connection unavailable");
      throw e;
    }
  }, []);

  const poller = useMemo(
    () => createPoller({ load, delay: (failures) => pollDelay({ visible: isPageVisible(), active: activeRef.current, failures }) }),
    [load]
  );

  useEffect(() => {
    void poller.start();
    const tick = setInterval(() => setNow(Date.now()), 15_000);
    function onVisibility() {
      if (!isPageVisible()) return;
      void poller.poke();
      setPokeKey((n) => n + 1);
    }
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      poller.stop();
      clearInterval(tick);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [poller]);

  // Opening a conversation switches to fast polling straight away.
  useEffect(() => {
    if (panel) void poller.poke();
  }, [panel, poller]);

  // Back online (seen by the background status check): load now, no reload needed.
  const wasOffline = useRef(false);
  useEffect(() => {
    if (presence.online === false) wasOffline.current = true;
    if (presence.online === true && wasOffline.current) {
      wasOffline.current = false;
      void poller.poke();
      setPokeKey((n) => n + 1);
    }
  }, [presence.online, poller]);

  // The open conversation is a history entry, so the phone's Back closes it.
  const panelOpen = useRef(false);
  useEffect(() => {
    const onPop = () => {
      panelOpen.current = false;
      setPanel(null);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  const openPanel = useCallback((target: PanelTarget) => {
    if (!panelOpen.current) window.history.pushState({ ...window.history.state, aiTeamPanel: true }, "");
    panelOpen.current = true;
    setPanel(target);
  }, []);
  const closePanel = useCallback(() => {
    if (window.history.state?.aiTeamPanel) {
      window.history.back();
      return;
    }
    panelOpen.current = false;
    setPanel(null);
  }, []);
  const refresh = useCallback(() => void poller.poke(), [poller]);

  const data = board?.snapshot ?? null;
  const employees = useMemo(() => teamEmployees(data?.employees), [data]);
  const names = useMemo(() => Object.fromEntries(employees.map((e) => [e.id, e.name])), [employees]);
  const tasks = useMemo(() => data?.tasks ?? [], [data]);
  const visible = useMemo(
    () => tasks.filter((t) => (filter === "all" || t.project_id === filter) && (!person || t.employee_id === person)),
    [tasks, filter, person]
  );
  const groups = useMemo(() => groupByState(visible), [visible]);
  const selected = panel?.kind === "task" || panel?.kind === "run" ? `${panel.project_id}/${panel.task_id}` : null;
  const openTask = (task: Task) => openPanel({ kind: "task", project_id: task.project_id, task_id: task.task_id });
  const chat = (employeeId: string) => openPanel(employeeId === LEAD_ID ? { kind: "adam" } : { kind: "person", employee_id: employeeId });
  const showTasks = (employeeId: string) => {
    setPerson((current) => (current === employeeId ? null : employeeId));
    tasksRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const problems = data?.projects.filter((p) => p.error || p.rejected_count > 0) ?? [];
  const asOf = board?.receivedAt ?? null;

  return (
    <OfflineProvider value={offline}>
      <StepUpProvider>
        <div className="page-shell">
          <PageHeader
            title="AI Team"
            description="Status comes from recorded task events. Chat never changes a task’s state."
            actions={
              <Button onClick={() => openPanel({ kind: "adam" })}>
                <MessageSquare className="h-4 w-4" aria-hidden="true" />
                Ask Adam
              </Button>
            }
          />

          {offline ? <OfflineHeader lastSeenAt={presence.lastSeenAt} now={now} /> : null}

          {!offline && (error || (runner && !runner.online) || asOf) ? (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-muted-foreground" role="status">
              {error ? (
                <span className="text-danger">
                  {error}
                  {asOf ? ` · showing data from ${formatAge(new Date(asOf).toISOString(), now)}` : ""}
                </span>
              ) : asOf ? (
                <span>Updated {formatAge(new Date(asOf).toISOString(), now)}</span>
              ) : null}
              {runner && !runner.online ? <span>Runner offline: runs will start when it is back</span> : null}
            </div>
          ) : null}

          {!board && !offline && !error ? <MutedText>Loading your team…</MutedText> : null}

          <div className={cn("flex flex-col gap-6", offline && "opacity-70")}>
            {offline && asOf ? <p className="text-[13px] font-semibold text-muted-foreground">As of {clockTime(asOf)}</p> : null}

            {board ? <AttentionStrip items={board.attention} projectFilter={filter} onOpen={openPanel} /> : null}

            {problems.map((p) => (
              <ErrorText key={p.project_id}>
                {p.project_id}:{" "}
                {p.error ?? `${p.rejected_count} task log ${p.rejected_count === 1 ? "line was" : "lines were"} rejected`}
              </ErrorText>
            ))}
            {data?.projects
              .filter((p) => p.paused)
              .map((p) => (
                <p key={`paused-${p.project_id}`} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <PauseCircle className="h-4 w-4" aria-hidden="true" />
                  Dispatch is paused for {p.project_id}.
                </p>
              ))}

            <section aria-label="Employees" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {employees.map((employee) => (
                <EmployeeCard
                  key={employee.id}
                  employee={employee}
                  tasks={tasks}
                  now={now}
                  onOpen={openTask}
                  onShowTasks={showTasks}
                  onChat={chat}
                  active={person === employee.id}
                />
              ))}
            </section>

            <section aria-label="Tasks" ref={tasksRef} className="grid scroll-mt-20 gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-bold">
                  Tasks <span className="font-semibold text-muted-foreground">{visible.length}</span>
                </h2>
                <div className="flex flex-wrap gap-2">
                  <Select aria-label="Project" value={filter} onChange={(event) => setFilter(event.target.value)}>
                    <option value="all">All projects</option>
                    {(data?.projects ?? []).map((p) => (
                      <option key={p.project_id} value={p.project_id}>
                        {p.project_id}
                      </option>
                    ))}
                  </Select>
                  <Select aria-label="Person" value={person ?? ""} onChange={(event) => setPerson(event.target.value || null)}>
                    <option value="">Everyone</option>
                    {employees.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.name}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
              {person ? (
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  Showing tasks for <strong>{names[person] ?? person}</strong>
                  <Button variant="ghost" onClick={() => setPerson(null)}>
                    <X className="h-4 w-4" aria-hidden="true" />
                    Show everyone
                  </Button>
                </div>
              ) : null}
              {board && groups.length === 0 ? (
                <div className="grid justify-items-center gap-3 rounded-3xl border border-dashed border-border p-8 text-center">
                  <p className="text-sm text-muted-foreground">{tasks.length === 0 ? "No tasks recorded yet." : "No tasks match these filters."}</p>
                  {tasks.length > 0 ? (
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setPerson(null);
                        setFilter("all");
                      }}
                    >
                      Clear filters
                    </Button>
                  ) : null}
                </div>
              ) : null}
              <div className="grid gap-3">
                {groups.map((group) => {
                  const rows = (
                    <div className="divide-y divide-border border-t border-border">
                      {group.tasks.map((task) => (
                        <TaskRow key={taskRef(task)} task={task} names={names} selected={taskRef(task) === selected} onOpen={openTask} />
                      ))}
                    </div>
                  );
                  const heading = (
                    <>
                      <ToneBadge tone={stateTone(group.state)}>{stateLabel(group.state)}</ToneBadge>
                      <span className="text-sm font-semibold text-muted-foreground">{group.tasks.length}</span>
                    </>
                  );
                  // Finished work is folded away so open tasks stay in view.
                  return group.state === "accepted" || group.state === "cancelled" ? (
                    <details key={group.state} className="group overflow-hidden rounded-3xl border border-border bg-surface">
                      <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2 px-4">
                        {heading}
                        <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground transition-transform group-open:rotate-90" aria-hidden="true" />
                      </summary>
                      {rows}
                    </details>
                  ) : (
                    <div key={group.state} className="overflow-hidden rounded-3xl border border-border bg-surface">
                      <h3 className="flex min-h-12 items-center gap-2 px-4">{heading}</h3>
                      {rows}
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        </div>

        {panel ? (
          <ConversationSheet
            key={JSON.stringify(panel)}
            target={panel}
            data={data}
            employees={employees}
            pokeKey={pokeKey}
            onClose={closePanel}
            onOpen={openPanel}
            onChanged={refresh}
          />
        ) : null}
      </StepUpProvider>
    </OfflineProvider>
  );
}
