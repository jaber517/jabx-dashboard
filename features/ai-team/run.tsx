"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronRight, Loader2, Play, RotateCcw, Square, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { action, teamApi, type Action } from "./api";
import { FAST_MS, HIDDEN_MS, isPageVisible } from "./polling";
import {
  canCancel,
  createRunFeed,
  describeTask,
  errorText,
  formatElapsed,
  isFinalRun,
  lastHeard,
  needsAcknowledging,
  RUN_STATUS,
  runAnnouncement,
  runHasCause,
  startSummary,
  type PollHealth
} from "./runs";
import { formatTime } from "./status";
import { useStepUpGuard } from "./step-up-sheet";
import type { Proposal, Run } from "./types";
import { ErrorText, Field, Fields, InlineText, MutedText, NeedsMacBook, ToneBadge, useOffline } from "./ui";

export const runCardId = (runId: string) => `run-card-${runId}`;
const runInterval = () => (isPageVisible() ? FAST_MS : HIDDEN_MS);

function codeWorkspace(report: string | null) {
  if (!report) return null;
  const branch = report.match(/^Branch: (.+)$/m)?.[1];
  const worktree = report.match(/^Worktree: (.+)$/m)?.[1];
  return branch && worktree ? { branch, worktree } : null;
}

// Says when a run's data may be out of date: retrying after errors, or stopped on one.
function RunHealth({ health, onRetry }: { health: PollHealth; onRetry?: () => void }) {
  const offline = useOffline();
  if (health.state === "live" || offline) return null;
  const since = health.last_success_at
    ? `Last updated ${formatTime(new Date(health.last_success_at).toISOString())}.`
    : "Not updated since it opened.";
  return (
    <div className="flex flex-wrap items-center gap-2">
      <ErrorText>
        {health.state === "retrying"
          ? `Could not refresh this run (${health.error}). Trying again in ${Math.round(health.retry_in_ms / 1000)} s. `
          : `Stopped following this run: ${health.error}. `}
        {since}
      </ErrorText>
      {onRetry ? (
        <Button variant="ghost" onClick={onRetry}>
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Retry now
        </Button>
      ) : null}
    </div>
  );
}

// One run: status, timing, the runner's latest activity and heartbeat age, cancel while
// active, the cause of a failure and, once finished, the worker's report.
export function RunCard({
  run,
  now,
  busy = false,
  error = "",
  onCancel,
  health = null,
  onRetry,
  announcement = ""
}: {
  run: Run;
  now: number;
  busy?: boolean;
  error?: string;
  onCancel?: () => void;
  health?: PollHealth | null;
  onRetry?: () => void;
  announcement?: string;
}) {
  const offline = useOffline();
  const [confirming, setConfirming] = useState(false);
  const status = RUN_STATUS[run.status];
  const active = !isFinalRun(run.status);
  const end = run.finished_at ? Date.parse(run.finished_at) : now;
  const workspace = run.status === "finished" ? codeWorkspace(run.report) : null;
  return (
    <section
      className="grid gap-3 rounded-3xl border border-border bg-surface p-4"
      id={runCardId(run.run_id)}
      tabIndex={-1}
      aria-label={`Run: ${describeTask(run.employee_task).who}`}
    >
      <p className="sr-only" role="status">
        {announcement}
      </p>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[13px] font-semibold text-muted-foreground">Run · {describeTask(run.employee_task).who}</p>
        <ToneBadge tone={status.tone}>{status.label}</ToneBadge>
      </div>
      <Fields>
        <Field label="Queued" value={formatTime(run.queued_at)} />
        <Field label="Started" value={formatTime(run.started_at)} />
        <Field label={active ? "Elapsed" : "Took"} value={formatElapsed(run.started_at, end)} />
        {run.finished_at ? <Field label="Ended" value={formatTime(run.finished_at)} /> : null}
        {workspace ? <Field label="Branch" value={workspace.branch} /> : null}
        {workspace ? <Field label="Worktree" value={workspace.worktree} /> : null}
      </Fields>
      {active && run.activity ? <p className="text-sm text-foreground">{run.activity}</p> : null}
      {active ? <MutedText>{lastHeard(run.last_heartbeat_at, now)}</MutedText> : null}
      {health ? <RunHealth health={health} onRetry={onRetry} /> : null}
      {runHasCause(run.status) && run.cause ? <p className="text-sm text-danger">{run.cause}</p> : null}
      {run.status === "finished" ? (
        run.report ? (
          <details className="group rounded-2xl border border-border">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 px-3 text-sm font-semibold">
              Report
              <ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90" aria-hidden="true" />
            </summary>
            <div className="max-h-96 overflow-y-auto whitespace-pre-wrap break-words border-t border-border px-3 py-3 text-sm leading-6">
              <InlineText text={run.report} />
            </div>
          </details>
        ) : (
          <MutedText>No report text came back. Adam can read the run folder.</MutedText>
        )
      ) : null}
      {run.status === "finished" ? <MutedText>Waiting for Adam’s review. Nothing was merged or accepted automatically.</MutedText> : null}
      {active && canCancel(run.status) && onCancel ? (
        confirming ? (
          <div className="grid gap-2">
            <MutedText>Stop this run? The work so far stays in the run folder.</MutedText>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" disabled={busy || offline} onClick={onCancel}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Square className="h-4 w-4" aria-hidden="true" />}
                Yes, cancel run
              </Button>
              <Button variant="secondary" disabled={busy} onClick={() => setConfirming(false)}>
                Keep running
              </Button>
            </div>
            <NeedsMacBook />
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="secondary" disabled={offline} onClick={() => setConfirming(true)}>
              <X className="h-4 w-4" aria-hidden="true" />
              Cancel run
            </Button>
            <NeedsMacBook />
          </div>
        )
      ) : null}
      {error ? <ErrorText>{error}</ErrorText> : null}
    </section>
  );
}

// Follows a run through one createRunFeed, the only owner of its state. Loads once on
// opening, even a final run, because reading a failed run is what clears its attention item.
// Cancel asks for Face ID first; a failed cancel keeps its request_id, so pressing the button
// again is a retry.
export function RunBlock({
  run: initial,
  onChanged,
  onAcknowledged
}: {
  run: Run;
  onChanged?: (run: Run, previous: Run) => void;
  onAcknowledged?: () => void;
}) {
  const guard = useStepUpGuard();
  const [run, setRun] = useState(initial);
  const [now, setNow] = useState(() => Date.now());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [health, setHealth] = useState<PollHealth | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const cancelAction = useRef<Action<Run> | null>(null);
  const feed = useRef<ReturnType<typeof createRunFeed> | null>(null);
  const changed = useRef(onChanged);
  changed.current = onChanged;
  const acknowledged = useRef(onAcknowledged);
  acknowledged.current = onAcknowledged;
  const first = useRef(initial);
  const active = !isFinalRun(run.status);
  const runId = initial.run_id;

  useEffect(() => {
    let seen = false;
    const current = createRunFeed(first.current, {
      load: () => teamApi.run(runId),
      intervalMs: runInterval,
      onLoad: (loaded) => {
        if (seen || !needsAcknowledging(loaded)) return;
        seen = true;
        acknowledged.current?.();
      },
      onRun: (next, previous) => {
        setRun(next);
        const said = runAnnouncement(previous, next);
        if (said) setAnnouncement(said);
        changed.current?.(next, previous);
      },
      onHealth: setHealth
    });
    feed.current = current;
    void current.start({ immediate: true }).catch(() => undefined);
    return () => {
      current.stop();
      feed.current = null;
    };
  }, [runId]);

  // A copy from the parent's list counts only if it is newer than ours.
  useEffect(() => {
    feed.current?.offer(initial);
  }, [initial]);

  useEffect(() => {
    if (!active) return;
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tick);
  }, [active]);

  async function cancel() {
    const current = cancelAction.current ?? action((request_id) => teamApi.cancelRun(runId, request_id));
    cancelAction.current = current;
    setBusy(true);
    setError("");
    try {
      await guard(() => (feed.current ? feed.current.mutate(current.run) : current.run()));
      cancelAction.current = null;
    } catch (e) {
      setError(`${errorText(e, "The cancel was not sent")}. Press the button again to retry.`);
    } finally {
      setBusy(false);
    }
  }

  const retry = () => {
    void feed.current?.start({ immediate: true }).catch(() => undefined);
  };
  return (
    <RunCard
      run={run}
      now={now}
      busy={busy}
      error={error}
      onCancel={() => void cancel()}
      health={health}
      onRetry={retry}
      announcement={announcement}
    />
  );
}

// Every run for a task, newest first; each opens its card. Says plainly while the list is
// loading or when it could not be loaded, rather than showing an empty list.
export function RunsList({
  runs,
  state = "ready",
  error = "",
  onRetry,
  onChanged,
  onAcknowledged
}: {
  runs: Run[];
  state?: "loading" | "ready" | "failed";
  error?: string;
  onRetry?: () => void;
  onChanged?: (run: Run, previous: Run) => void;
  onAcknowledged?: () => void;
}) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <section className="grid gap-2" aria-label="Runs">
      <h3 className="text-sm font-bold">
        Runs <span className="font-semibold text-muted-foreground">{state === "loading" && runs.length === 0 ? "…" : runs.length}</span>
      </h3>
      {state === "loading" && runs.length === 0 ? <MutedText>Loading runs…</MutedText> : null}
      {state === "failed" ? (
        <div className="flex flex-wrap items-center gap-2">
          <ErrorText>
            {runs.length ? `Could not refresh the runs (${error}). Showing the last list that loaded.` : `Could not load the runs: ${error}.`}
          </ErrorText>
          {onRetry ? (
            <Button variant="ghost" onClick={onRetry}>
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Retry
            </Button>
          ) : null}
        </div>
      ) : null}
      {state === "ready" && runs.length === 0 ? <MutedText>No runs started from the dashboard yet.</MutedText> : null}
      {runs.map((run) =>
        open === run.run_id ? (
          <div className="grid gap-1" key={run.run_id}>
            <RunBlock run={run} onChanged={onChanged} onAcknowledged={onAcknowledged} />
            <Button variant="ghost" className="justify-self-start" onClick={() => setOpen(null)}>
              Hide run
            </Button>
          </div>
        ) : (
          <button
            key={run.run_id}
            type="button"
            className="flex min-h-12 items-center justify-between gap-3 rounded-2xl border border-border px-3 py-2 text-left hover:bg-muted/60"
            onClick={() => setOpen(run.run_id)}
            aria-expanded={false}
          >
            <span className="grid gap-1">
              <span className="text-[13px] text-muted-foreground">
                {formatTime(run.queued_at)} · {describeTask(run.employee_task).who}
              </span>
              <ToneBadge tone={RUN_STATUS[run.status].tone}>{RUN_STATUS[run.status].label}</ToneBadge>
            </span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </button>
        )
      )}
    </section>
  );
}

// States plainly what starting will do. Escape closes unless busy.
export function StartDialog({
  proposal,
  busy = false,
  error = "",
  onConfirm,
  onClose
}: {
  proposal: Proposal;
  busy?: boolean;
  error?: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const offline = useOffline();
  const confirmRef = useRef<HTMLButtonElement>(null);
  const summary = startSummary(proposal);
  const close = useRef(onClose);
  close.current = onClose;
  const busyRef = useRef(busy);
  busyRef.current = busy;

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    confirmRef.current?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape" && !busyRef.current) close.current();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      if (previous?.isConnected) previous.focus();
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-[#07111B]/70 sm:items-center sm:p-4"
      onClick={busy ? undefined : onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-busy={busy}
        aria-labelledby={`start-${proposal.proposal_id}`}
        className="max-h-[90vh] w-full overflow-y-auto rounded-t-3xl border-t border-border bg-surface p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:max-w-lg sm:rounded-3xl sm:border sm:pb-6"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id={`start-${proposal.proposal_id}`} className="text-xl font-bold">
          Start this run?
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{proposal.title}</p>
        <div className="mt-4">
          <Fields>
            <Field label="Who" value={summary.who} />
            <Field label="Engine" value={summary.engine} />
            <Field label="Project" value={summary.project} />
            <Field label={summary.locationLabel} value={summary.location} />
            <Field label="Time budget" value={summary.budget} />
          </Fields>
        </div>
        <p className="mt-4 text-sm leading-6">{summary.outcome}</p>
        {summary.independence ? <p className="mt-2 text-sm leading-6">{summary.independence}</p> : null}
        {error ? (
          <div className="mt-3">
            <ErrorText>{error}</ErrorText>
          </div>
        ) : null}
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <Button ref={confirmRef} disabled={busy || offline} onClick={onConfirm}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Play className="h-4 w-4" aria-hidden="true" />}
            Start run
          </Button>
          <Button variant="secondary" disabled={busy} onClick={onClose}>
            Cancel
          </Button>
          <NeedsMacBook />
        </div>
      </div>
    </div>
  );
}
