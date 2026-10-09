"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Loader2, Play, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { action, teamApi, type Action } from "./api";
import { latestOnly } from "./polling";
import { errorText, isFinalRun, mergeRuns, runsForProposal, showStart } from "./runs";
import { RunBlock, StartDialog } from "./run";
import { formatTime, type Tone } from "./status";
import { useStepUpGuard } from "./step-up-sheet";
import type { Decision, Proposal, Run, RunEligibility } from "./types";
import { ErrorText, Field, Fields, MutedText, NeedsMacBook, ToneBadge, useOffline } from "./ui";

const STATUS: Record<Proposal["status"], { label: string; tone: Tone }> = {
  proposed: { label: "Awaiting your decision", tone: "waiting" },
  approved: { label: "Approved", tone: "done" },
  changes_requested: { label: "Changes requested", tone: "review" },
  declined: { label: "Declined", tone: "blocked" },
  superseded: { label: "Replaced by a newer version", tone: "neutral" }
};

export function decisionResult(proposal: Proposal) {
  if (proposal.status === "approved") {
    return proposal.task_id
      ? `Approved: task ${proposal.task_id} is in the backlog for Adam to assign.`
      : "Approved: the task is in the backlog for Adam to assign.";
  }
  if (proposal.status === "changes_requested") return "Changes requested: Adam will send a new version here.";
  if (proposal.status === "declined") return "Declined: nothing was added to the backlog.";
  if (proposal.status === "superseded") return "This version was replaced by a newer version below.";
  return null;
}

function List({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <h4 className="text-sm font-bold">{title}</h4>
      <ul className="mt-1 list-disc space-y-1 pl-5 text-sm leading-6">
        {items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

type StartLoad = { state: "loading" | "ready" | "failed"; error: string };

export function ProposalCard({
  proposal,
  busy = false,
  error = "",
  onDecide,
  eligibility = null,
  runs = [],
  onStart,
  startLoad = null,
  onRetryStartLoad,
  onRunChanged,
  onRunAcknowledged
}: {
  proposal: Proposal;
  busy?: boolean;
  error?: string;
  onDecide?: (decision: Decision, note?: string) => void;
  eligibility?: RunEligibility | null;
  runs?: Run[];
  onStart?: () => void;
  startLoad?: StartLoad | null;
  onRetryStartLoad?: () => void;
  onRunChanged?: (run: Run, previous: Run) => void;
  onRunAcknowledged?: () => void;
}) {
  const offline = useOffline();
  const [noting, setNoting] = useState(false);
  const [note, setNote] = useState("");
  const status = STATUS[proposal.status];
  const open = proposal.status === "proposed";
  const result = decisionResult(proposal);
  const locked = busy || offline;
  return (
    <section
      className={`grid gap-3 rounded-3xl border border-border bg-surface p-4 ${proposal.status === "superseded" ? "opacity-60" : ""}`}
      aria-label={`Proposal: ${proposal.title}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[13px] font-semibold text-muted-foreground">
          Proposal · v{proposal.version} · {formatTime(proposal.created_at)}
        </p>
        <ToneBadge tone={status.tone}>{status.label}</ToneBadge>
      </div>
      <h3 className="text-[17px] font-bold">{proposal.title}</h3>
      <Fields>
        <Field label="Project" value={proposal.project_id} />
        <Field label="Assignee" value={proposal.employee_task} />
        <Field label="Budget" value={`${proposal.budget_minutes} min`} />
      </Fields>
      <p className="whitespace-pre-wrap text-sm leading-6">{proposal.objective}</p>
      <List title="Scope" items={proposal.scope} />
      <List title="Checks" items={proposal.checks} />
      <List title="Sources" items={proposal.sources} />
      {open ? (
        <>
          <MutedText>
            Approving adds a backlog task and starts nothing. If the dashboard can run this kind of task, a Start button
            appears; other work Adam starts from the terminal.
          </MutedText>
          {noting ? (
            <label className="grid gap-1.5">
              <span className="text-sm font-medium">What should change?</span>
              <Textarea
                rows={3}
                className="min-h-[5rem]"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                disabled={busy}
              />
            </label>
          ) : null}
          <div className="flex flex-wrap gap-2">
            {noting ? (
              <>
                <Button disabled={locked || !note.trim()} onClick={() => onDecide?.("request_changes", note.trim())}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
                  Send request
                </Button>
                <Button variant="secondary" disabled={busy} onClick={() => setNoting(false)}>
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button disabled={locked} onClick={() => onDecide?.("approve")}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Check className="h-4 w-4" aria-hidden="true" />}
                  Approve
                </Button>
                <Button variant="secondary" disabled={locked} onClick={() => setNoting(true)}>
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  Request changes
                </Button>
                <Button variant="secondary" disabled={locked} onClick={() => onDecide?.("decline")}>
                  <X className="h-4 w-4" aria-hidden="true" />
                  Decline
                </Button>
              </>
            )}
          </div>
          <NeedsMacBook />
        </>
      ) : null}
      {result ? (
        <p className="text-sm font-medium" role="status">
          {result}
        </p>
      ) : null}
      {proposal.decided_at ? <MutedText>Decided {formatTime(proposal.decided_at)}</MutedText> : null}
      {runs.map((run) => (
        <RunBlock key={run.run_id} run={run} onChanged={onRunChanged} onAcknowledged={onRunAcknowledged} />
      ))}
      {proposal.status === "approved" && showStart(proposal, eligibility) ? (
        <div className="flex flex-wrap items-center gap-3">
          <Button disabled={offline} onClick={onStart}>
            <Play className="h-4 w-4" aria-hidden="true" />
            Start
          </Button>
          <NeedsMacBook />
        </div>
      ) : null}
      {proposal.status === "approved" && eligibility && !eligibility.can_start && eligibility.reason ? (
        <MutedText>{eligibility.reason}</MutedText>
      ) : null}
      {proposal.status === "approved" && !eligibility && startLoad?.state === "loading" ? (
        <MutedText>Checking whether this can start…</MutedText>
      ) : null}
      {proposal.status === "approved" && startLoad?.state === "failed" && !offline ? (
        <div className="flex flex-wrap items-center gap-2">
          <ErrorText>
            {eligibility
              ? `Could not refresh whether this can start (${startLoad.error}).`
              : `Could not check whether this can start: ${startLoad.error}.`}
          </ErrorText>
          {onRetryStartLoad ? (
            <Button variant="ghost" onClick={onRetryStartLoad}>
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Retry
            </Button>
          ) : null}
        </div>
      ) : null}
      {error ? <ErrorText>{error}</ErrorText> : null}
    </section>
  );
}

// Loads a proposal by id and sends decisions, each after Face ID. A failed decision keeps its
// request_id, so pressing the same button again is a retry rather than a second decision.
// Starting a run works the same way: one request_id per Start, reused until it is accepted.
export function ProposalBlock({
  proposalId,
  reloadKey = 0,
  onDecided
}: {
  proposalId: string;
  reloadKey?: number;
  onDecided?: () => void;
}) {
  const guard = useStepUpGuard();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<{ key: string; action: Action<Proposal> } | null>(null);
  const [eligibility, setEligibility] = useState<RunEligibility | null>(null);
  const [runs, setRuns] = useState<Run[]>([]);
  const [startLoad, setStartLoad] = useState<StartLoad>({ state: "loading", error: "" });
  const [dialog, setDialog] = useState(false);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState("");
  const startAction = useRef<Action<Run> | null>(null);
  const proposalLoads = useRef(latestOnly());
  const startLoads = useRef(latestOnly());

  const load = useCallback(async () => {
    const current = proposalLoads.current.begin();
    try {
      const next = await teamApi.proposal(proposalId);
      if (current()) {
        setProposal(next);
        setError("");
      }
    } catch (e) {
      if (current()) setError(errorText(e, "Could not load this proposal"));
    }
  }, [proposalId]);
  useEffect(() => {
    void load();
    const loads = proposalLoads.current;
    return () => loads.invalidate();
  }, [load, reloadKey]);

  // Once approved: may it start (the server decides, also after an earlier run), and which
  // runs has it started? Reloaded after every run transition; only the newest answer counts.
  const approvedTask = proposal?.status === "approved" ? proposal.task_id : null;
  const project = proposal?.project_id;
  const loadStart = useCallback(async () => {
    if (!approvedTask || !project) return;
    const current = startLoads.current.begin();
    setStartLoad((s) => ({ ...s, state: s.state === "failed" ? "failed" : "loading" }));
    const [list, next] = await Promise.allSettled([teamApi.runs(project, approvedTask), teamApi.eligibility(proposalId)]);
    if (!current()) return;
    if (list.status === "fulfilled") setRuns((mine) => mergeRuns(mine, runsForProposal(list.value, proposalId)));
    if (next.status === "fulfilled") setEligibility(next.value);
    const failed = list.status === "rejected" ? list.reason : next.status === "rejected" ? next.reason : null;
    setStartLoad(failed ? { state: "failed", error: errorText(failed, "The server did not answer") } : { state: "ready", error: "" });
  }, [approvedTask, project, proposalId]);
  useEffect(() => {
    void loadStart();
    const loads = startLoads.current;
    return () => loads.invalidate();
  }, [loadStart, reloadKey]);

  // A run moved on: keep the list in step and ask again whether Start is allowed.
  const onRunChanged = useCallback(
    (next: Run, previous: Run) => {
      setRuns((list) => list.map((run) => (run.run_id === next.run_id ? next : run)));
      if (next.status === previous.status) return;
      void loadStart();
      if (isFinalRun(next.status)) onDecided?.();
    },
    [loadStart, onDecided]
  );

  async function start() {
    const current = startAction.current ?? action((request_id) => teamApi.startRun(proposalId, request_id));
    startAction.current = current;
    setStarting(true);
    setStartError("");
    try {
      const run = await guard(current.run);
      startAction.current = null;
      setRuns((list) => [run, ...list.filter((r) => r.run_id !== run.run_id)]);
      setDialog(false);
      void loadStart();
      onDecided?.();
    } catch (e) {
      setStartError(`${errorText(e, "The run was not started")}. Press Start run again to retry.`);
    } finally {
      setStarting(false);
    }
  }

  async function decide(decision: Decision, note?: string) {
    if (!proposal) return;
    const key = `${decision}:${note ?? ""}`;
    const current =
      pending?.key === key
        ? pending.action
        : action((request_id) => teamApi.decide(proposal.proposal_id, { decision, note, version: proposal.version, request_id }));
    setPending({ key, action: current });
    setBusy(true);
    setError("");
    try {
      setProposal(await guard(current.run));
      setPending(null);
      onDecided?.();
    } catch (e) {
      setError(`${errorText(e, "The decision was not saved")}. Press the button again to retry.`);
      void load();
    } finally {
      setBusy(false);
    }
  }

  if (!proposal) {
    if (!error) return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-label="Loading proposal" />;
    return (
      <div className="flex flex-wrap items-center gap-2">
        <ErrorText>Could not load this proposal: {error}.</ErrorText>
        <Button variant="ghost" onClick={() => void load()}>
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Retry
        </Button>
      </div>
    );
  }
  return (
    <>
      <ProposalCard
        proposal={proposal}
        busy={busy}
        error={error}
        onDecide={(decision, note) => void decide(decision, note)}
        eligibility={eligibility}
        runs={runs}
        onStart={() => setDialog(true)}
        startLoad={startLoad}
        onRetryStartLoad={() => void loadStart()}
        onRunChanged={onRunChanged}
        onRunAcknowledged={onDecided}
      />
      {dialog ? (
        <StartDialog
          proposal={proposal}
          busy={starting}
          error={startError}
          onConfirm={() => void start()}
          onClose={() => {
            setDialog(false);
            setStartError("");
          }}
        />
      ) : null}
    </>
  );
}
