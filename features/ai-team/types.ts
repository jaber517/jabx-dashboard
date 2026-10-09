// Data shapes of the Jabx team dashboard API (Jabx apps/dashboard/lib/api.ts and
// lib/contracts.ts), written out by hand. Responses are checked with the guards in
// lib/team-contracts.ts on the server and again in features/ai-team/api.ts.

// --- Snapshot -------------------------------------------------------------------------
export type Attempt = {
  id: string;
  status: string;
  lane: string | null;
  // Copied from the relay result; it can echo the requested model, so it is not evidence of what ran.
  model: string | null;
  started_at: string | null;
  finished_at: string | null;
  relay_status: string | null;
  exit_code: number | null;
  result_path: string | null;
  out_dir: string | null;
};

export type Review = {
  reviewer: string;
  reviewer_engine: string;
  verdict: string;
  findings: number;
  at: string;
};

export type Task = {
  project_id: string;
  task_id: string;
  title: string;
  state: string;
  review_state: string;
  // Assignment fields are null until task_assigned; a backlog task must still render.
  employee_id: string | null;
  task_key: string | null;
  implementer: string | null;
  model: string | null;
  lane: string | null;
  current_attempt: string | null;
  attempts: Attempt[];
  stale: boolean;
  blocked_reason: string | null;
  next_action: string | null;
  integrated_commit: string | null;
  latest_review: Review | null;
  created_at: string | null;
  updated_at: string | null;
};

export type ProjectSummary = {
  project_id: string;
  error: string | null;
  paused: boolean;
  last_event_at: string | null;
  event_count: number;
  duplicates_ignored: number;
  rejected_count: number;
  rejected_lines: { line: number; reason: string }[];
};

export type Employee = {
  id: string;
  name: string;
  role: string;
  photo: string | null;
};

export type Snapshot = {
  generated_at: string;
  projects: ProjectSummary[];
  employees: Employee[];
  tasks: Task[];
};

export const taskRef = (task: Pick<Task, "project_id" | "task_id">) => `${task.project_id}/${task.task_id}`;

// --- Threads and messages ---------------------------------------------------------------
// adam:   the team-level thread with Adam (planning, requests, decisions).
// person: Jaber's general thread about one employee; Adam answers it for now.
// task:   the running record of one task (project_id + task_id). Adam answers here too.
export type ThreadKind = "adam" | "person" | "task";

export type Thread = {
  thread_id: string;
  kind: ThreadKind;
  employee_id: string | null;
  project_id: string | null;
  task_id: string | null;
  title: string;
  unread: number;
  last_message_at: string | null;
  // True while Adam is composing a reply; the client keeps polling.
  pending_reply: boolean;
};

export type Message = {
  message_id: string;
  thread_id: string;
  role: "jaber" | "adam" | "system";
  body: string;
  created_at: string;
  // Set when this message carries a proposal card.
  proposal_id: string | null;
  // failed: Adam could not reply (quota, login, timeout); body explains, Jaber can retry.
  status: "sent" | "failed";
};

// Task events rendered inside a task conversation, built from the event log.
export type TimelineEvent = {
  event_id: string;
  type: string;
  at: string;
  actor: string | null;
  summary: string;
};

export type ThreadDetail = {
  thread: Thread;
  messages: Message[];
  // Only for task threads; empty otherwise.
  events: TimelineEvent[];
};

export type OpenTarget =
  | { kind: "adam" }
  | { kind: "person"; employee_id: string }
  | { kind: "task"; project_id: string; task_id: string };

// --- Proposals --------------------------------------------------------------------------
export type ProposalStatus = "proposed" | "approved" | "changes_requested" | "declined" | "superseded";

export type Proposal = {
  proposal_id: string;
  thread_id: string;
  version: number;
  status: ProposalStatus;
  project_id: string;
  employee_task: string; // e.g. "maya.discovery"
  title: string;
  objective: string;
  scope: string[];
  checks: string[];
  budget_minutes: number;
  // "<project>/<task_id>" of accepted research tasks a write-up is built from.
  sources: string[];
  created_at: string;
  decided_at: string | null;
  // Set after approval: the task created in the event log.
  task_id: string | null;
};

export type Decision = "approve" | "request_changes" | "decline";

// --- Runs -------------------------------------------------------------------------------
export type RunStatus =
  | "queued" // command stored, runner has not picked it up
  | "starting" // runner wrote the brief and is launching dispatch
  | "running" // dispatch process alive (heartbeat fresh)
  | "finished" // relay completed; task is needs_review for Adam
  | "failed" // relay or dispatch failed; cause recorded
  | "cancel_requested"
  | "cancelled"
  | "needs_attention"; // runner restarted and could not prove what happened

export type Run = {
  run_id: string;
  proposal_id: string;
  project_id: string;
  task_id: string;
  employee_task: string;
  status: RunStatus;
  attempt_id: string | null;
  queued_at: string;
  started_at: string | null;
  finished_at: string | null;
  last_heartbeat_at: string | null;
  // Latest normalised activity from the relay; descriptive only.
  activity: string | null;
  // Plain explanation for failed / needs_attention / cancelled.
  cause: string | null;
  // Excerpt of the worker's final report.
  report: string | null;
};

// Why the Start button is or is not available for a proposal.
export type RunEligibility = { can_start: boolean; reason: string | null };

export type RunnerStatus = { online: boolean; last_heartbeat_at: string | null };

// --- Needs your attention ---------------------------------------------------------------
export type AttentionItem =
  | { kind: "proposal"; proposal: Proposal }
  | { kind: "reply"; thread: Thread; preview: string }
  | { kind: "run"; run: Run };

export type Attention = { items: AttentionItem[] };

// --- dash's own status route ------------------------------------------------------------
export type TeamStatus = { online: boolean; lastSeenAt: string | null; runnerOnline?: boolean };
