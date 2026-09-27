"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useRef, useState, useTransition, type DragEvent } from "react";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { TaskStatusIcon } from "@/components/ui/task-status-icon";
import { useUndo } from "@/components/providers/undo-provider";
import { createTask, setTaskStatus } from "@/lib/actions";
import { categoryDot, categoryLabels, priorityTone, taskStatusTone } from "@/lib/constants";
import { dayKey, daysUntil, relativeDay, shortDate, todayKey } from "@/lib/dates";
import { getPriorityLabel, getTaskStatusLabel } from "@/lib/formatters";
import { useUrlState } from "@/lib/use-url-state";
import { cn } from "@/lib/utils";
import { PROJECT_CATEGORIES, TASK_PRIORITIES, TASK_STATUSES } from "@/types";
import type { TaskRecord, TaskStatus } from "@/types";
import { CreateTaskDialog } from "@/features/tasks/create-task-dialog";
import { TaskCardActions } from "@/features/tasks/task-card-actions";

type View = "board" | "list";

const quickFilters = [
  { id: "ALL", label: "All" },
  { id: "WEEK", label: "Due this week" },
  { id: "BLOCKED", label: "Blocked" },
  { id: "HIGH", label: "High priority" }
] as const;

const VIEW_KEY = "tasks-view";
const DRAG_TYPE = "application/x-jabx-task";

// A task flagged as blocked sits in the Blocked column whatever its status.
function columnOf(task: TaskRecord): TaskStatus {
  return task.blocked && task.status !== "DONE" ? "BLOCKED" : task.status;
}

function dueText(task: TaskRecord, today: string) {
  if (!task.dueDate) return { text: "No date", late: false };
  const days = daysUntil(task.dueDate, today);
  if (task.status === "DONE") return { text: shortDate(dayKey(task.dueDate), today), late: false };
  if (days < 0) return { text: `Overdue · ${shortDate(dayKey(task.dueDate), today)}`, late: true };
  return { text: relativeDay(task.dueDate, today), late: days === 0 };
}

function ProjectLine({ task }: { task: TaskRecord }) {
  return (
    <span className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
      <span className={cn("h-2 w-2 shrink-0 rounded-full", categoryDot[task.category])} aria-hidden="true" />
      <span className="truncate">{task.project?.title ?? categoryLabels[task.category]}</span>
    </span>
  );
}

// Type a title and press Enter to add a task straight into a column.
function QuickAdd({ status }: { status: TaskStatus }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) input.current?.focus();
  }, [open]);

  function submit() {
    const value = title.trim();
    if (!value) return setOpen(false);
    const form = new FormData();
    form.set("title", value);
    form.set("status", status);
    startTransition(async () => {
      const result = await createTask({ ok: true }, form);
      if (result.ok) {
        setTitle("");
        setError("");
        input.current?.focus();
      } else {
        setError(result.error ?? "Couldn't add that task.");
      }
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-10 items-center gap-2 rounded-2xl px-2.5 text-[13px] font-semibold text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
        Add task
      </button>
    );
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <Input
        ref={input}
        value={title}
        disabled={pending}
        onChange={(event) => setTitle(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setTitle("");
            setOpen(false);
          }
        }}
        onBlur={() => !title.trim() && setOpen(false)}
        placeholder="Task title, then Enter"
        aria-label={`New ${getTaskStatusLabel(status)} task`}
        className="h-10 bg-surface"
      />
      {error ? <p className="mt-1.5 text-xs font-medium text-danger">{error}</p> : null}
    </form>
  );
}

export function TasksView({
  tasks,
  projects = []
}: {
  tasks: TaskRecord[];
  projects?: { id: string; title: string }[];
}) {
  const [filters, setFilters] = useUrlState({
    q: "",
    quick: "ALL",
    status: "ALL",
    category: "ALL",
    project: "ALL",
    sort: "DUE"
  });
  // Older links used ?status=BLOCKED for the Blocked view.
  const quick = filters.status === "BLOCKED" && filters.quick === "ALL" ? "BLOCKED" : filters.quick;
  const status = filters.status === "BLOCKED" ? "ALL" : filters.status;

  const [query, setQuery] = useState(filters.q);
  const deferredQuery = useDeferredValue(query);
  const [view, setView] = useState<View>("board");
  const [mobileColumn, setMobileColumn] = useState<TaskStatus>("TODO");
  const [moved, setMoved] = useState<Record<string, TaskStatus>>({});
  const [dropTarget, setDropTarget] = useState<TaskStatus | null>(null);
  const [, startTransition] = useTransition();
  const { isPendingDelete, notify } = useUndo();
  const today = todayKey();

  useEffect(() => {
    try {
      if (localStorage.getItem(VIEW_KEY) === "list") setView("list");
    } catch {
      /* storage unavailable */
    }
  }, []);

  // Fresh server data replaces any optimistic column moves.
  useEffect(() => setMoved({}), [tasks]);

  function chooseView(next: View) {
    setView(next);
    try {
      localStorage.setItem(VIEW_KEY, next);
    } catch {
      /* storage unavailable */
    }
  }

  const columnFor = (task: TaskRecord) => moved[task.id] ?? columnOf(task);

  function moveTask(task: TaskRecord, to: TaskStatus) {
    const from = columnFor(task);
    if (from === to) return;
    setMoved((current) => ({ ...current, [task.id]: to }));
    startTransition(async () => {
      await setTaskStatus(task.id, to);
      notify(`Moved “${task.title}” to ${getTaskStatusLabel(to)}`, () => {
        setMoved((current) => ({ ...current, [task.id]: from }));
        startTransition(() => setTaskStatus(task.id, from));
      });
    });
  }

  const q = deferredQuery.trim().toLowerCase();
  const filtered = tasks.filter((task) => {
    if (isPendingDelete(task.id)) return false;
    if (q && !task.title.toLowerCase().includes(q) && !task.description.toLowerCase().includes(q)) return false;
    if (filters.category !== "ALL" && task.category !== filters.category) return false;
    if (status !== "ALL" && columnFor(task) !== status) return false;
    if (filters.project !== "ALL" && (filters.project === "INDEPENDENT" ? task.projectId : task.projectId !== filters.project)) return false;
    if (quick === "BLOCKED" && columnFor(task) !== "BLOCKED") return false;
    if (quick === "HIGH" && task.priority !== "CRITICAL" && task.priority !== "HIGH") return false;
    if (quick === "WEEK") {
      if (!task.dueDate || columnFor(task) === "DONE") return false;
      const days = daysUntil(task.dueDate, today);
      if (days < 0 || days > 6) return false;
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    switch (filters.sort) {
      case "TITLE":
        return a.title.localeCompare(b.title);
      case "PRIORITY":
        return TASK_PRIORITIES.indexOf(a.priority) - TASK_PRIORITIES.indexOf(b.priority);
      case "RECENT":
        return Date.parse(b.updatedAt) - Date.parse(a.updatedAt);
      default:
        return (a.dueDate ? Date.parse(a.dueDate) : Infinity) - (b.dueDate ? Date.parse(b.dueDate) : Infinity);
    }
  });

  const byColumn = (column: TaskStatus) => sorted.filter((task) => columnFor(task) === column);

  const chip = (active: boolean) =>
    cn(
      "h-9 rounded-full border px-3.5 text-[13px] font-semibold transition-colors",
      active ? "border-primary bg-muted text-foreground" : "border-border text-muted-foreground hover:text-foreground"
    );

  function onDrop(event: DragEvent, column: TaskStatus) {
    event.preventDefault();
    setDropTarget(null);
    const task = tasks.find((item) => item.id === event.dataTransfer.getData(DRAG_TYPE));
    if (task) moveTask(task, column);
  }

  return (
    <div className="page-shell">
      <PageHeader eyebrow="Workspace" title="Tasks" actions={<CreateTaskDialog projects={projects} />} />

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div role="group" aria-label="Quick filters" className="flex flex-1 flex-wrap gap-2">
            {quickFilters.map((filter) => (
              <button
                key={filter.id}
                type="button"
                aria-pressed={quick === filter.id}
                onClick={() => setFilters({ quick: filter.id, status })}
                className={chip(quick === filter.id)}
              >
                {filter.label}
              </button>
            ))}
          </div>
          <div role="group" aria-label="View" className="flex rounded-2xl border border-border p-0.5">
            {(["board", "list"] as const).map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={view === option}
                onClick={() => chooseView(option)}
                className={cn(
                  "h-8 rounded-xl px-3.5 text-[13px] font-semibold capitalize transition-colors",
                  view === option ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
          <Input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setFilters({ q: event.target.value });
            }}
            placeholder="Search tasks…"
            aria-label="Search tasks"
            className="h-10"
          />
          <Select value={filters.category} onChange={(event) => setFilters({ category: event.target.value })} aria-label="Category" className="h-10">
            <option value="ALL">All categories</option>
            {PROJECT_CATEGORIES.map((item) => (
              <option key={item} value={item}>{categoryLabels[item]}</option>
            ))}
          </Select>
          <Select value={filters.project} onChange={(event) => setFilters({ project: event.target.value })} aria-label="Project" className="h-10">
            <option value="ALL">All projects</option>
            <option value="INDEPENDENT">Independent tasks</option>
            {projects.map((item) => (
              <option key={item.id} value={item.id}>{item.title}</option>
            ))}
          </Select>
          <Select value={status} onChange={(event) => setFilters({ status: event.target.value })} aria-label="Status" className="h-10">
            <option value="ALL">All statuses</option>
            {TASK_STATUSES.map((item) => (
              <option key={item} value={item}>{getTaskStatusLabel(item)}</option>
            ))}
          </Select>
          <Select value={filters.sort} onChange={(event) => setFilters({ sort: event.target.value })} aria-label="Sort" className="h-10">
            <option value="DUE">Sort: Due date</option>
            <option value="PRIORITY">Sort: Priority</option>
            <option value="RECENT">Sort: Recently updated</option>
            <option value="TITLE">Sort: Title A–Z</option>
          </Select>
        </div>
      </div>

      {view === "board" ? (
        <>
          {/* Phones: one column at a time. */}
          <div role="tablist" aria-label="Columns" className="grid grid-cols-4 gap-1 rounded-2xl border border-border p-1 md:hidden">
            {TASK_STATUSES.map((column) => (
              <button
                key={column}
                type="button"
                role="tab"
                aria-selected={mobileColumn === column}
                onClick={() => setMobileColumn(column)}
                className={cn(
                  "flex h-11 flex-col items-center justify-center rounded-xl text-[11px] font-semibold leading-tight",
                  mobileColumn === column ? "bg-muted text-foreground" : "text-muted-foreground"
                )}
              >
                {getTaskStatusLabel(column)}
                <span className="tabular-nums">{byColumn(column).length}</span>
              </button>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2 min-[1360px]:grid-cols-4">
            {TASK_STATUSES.map((column) => {
              const columnTasks = byColumn(column);
              return (
                <section
                  key={column}
                  aria-label={getTaskStatusLabel(column)}
                  onDragOver={(event) => {
                    if (!event.dataTransfer.types.includes(DRAG_TYPE)) return;
                    event.preventDefault();
                    setDropTarget(column);
                  }}
                  onDragLeave={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDropTarget(null);
                  }}
                  onDrop={(event) => onDrop(event, column)}
                  className={cn(
                    "flex-col gap-2.5 rounded-3xl border bg-background/60 p-3 transition-colors dark:bg-[#0B1824]",
                    dropTarget === column ? "border-primary" : "border-border",
                    mobileColumn === column ? "flex" : "hidden md:flex"
                  )}
                >
                  <div className="flex items-center gap-2 px-1.5 py-1">
                    <span className={cn("h-2 w-2 rounded-full bg-current", taskStatusTone[column])} aria-hidden="true" />
                    <h2 className="flex-1 text-sm font-bold">{getTaskStatusLabel(column)}</h2>
                    <span className="text-[13px] font-semibold tabular-nums text-muted-foreground">{columnTasks.length}</span>
                  </div>
                  {columnTasks.map((task) => {
                    const due = dueText(task, today);
                    return (
                      <article
                        key={task.id}
                        draggable
                        onDragStart={(event) => {
                          event.dataTransfer.setData(DRAG_TYPE, task.id);
                          event.dataTransfer.effectAllowed = "move";
                        }}
                        className="group relative flex cursor-grab flex-col gap-2.5 rounded-2xl border border-border bg-surface p-3.5 transition-colors hover:border-primary active:cursor-grabbing"
                      >
                        <Link href={`/tasks/${task.id}`} draggable={false} className="text-sm font-semibold leading-snug after:absolute after:inset-0 after:rounded-2xl">
                          {task.title}
                        </Link>
                        <ProjectLine task={task} />
                        {columnFor(task) === "BLOCKED" && task.description ? (
                          <p className="line-clamp-2 text-xs leading-5 text-muted-foreground">{task.description}</p>
                        ) : null}
                        <div className="flex items-center justify-between gap-2">
                          <Badge className={priorityTone[task.priority]}>{getPriorityLabel(task.priority)}</Badge>
                          <span className={cn("text-xs font-semibold tabular-nums", due.late ? "text-danger" : "text-muted-foreground")}>
                            {due.text}
                          </span>
                        </div>
                        <div className="relative z-10 flex justify-end border-t border-border pt-2.5">
                          <TaskCardActions task={task} projects={projects} />
                        </div>
                      </article>
                    );
                  })}
                  {columnTasks.length === 0 ? (
                    <p className="rounded-2xl border border-dashed border-border px-3 py-6 text-center text-[13px] text-muted-foreground">
                      {dropTarget === column ? "Drop here" : "Nothing here"}
                    </p>
                  ) : null}
                  {column !== "DONE" ? <QuickAdd status={column} /> : null}
                </section>
              );
            })}
          </div>
        </>
      ) : filtered.length === 0 ? (
        <EmptyState title="No tasks match" description="Change the filters or search to bring tasks back." />
      ) : (
        <ul className="overflow-hidden rounded-3xl border border-border bg-surface">
          {sorted.map((task) => {
            const due = dueText(task, today);
            const column = columnFor(task);
            return (
              <li key={task.id} className="relative flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-border px-5 py-3.5 last:border-b-0 hover:bg-muted/40">
                <TaskStatusIcon status={column} className="shrink-0" />
                <div className="min-w-0 flex-1 basis-60">
                  <Link href={`/tasks/${task.id}`} className="block truncate text-[15px] font-semibold after:absolute after:inset-0">
                    {task.title}
                  </Link>
                  <ProjectLine task={task} />
                </div>
                <Badge className={taskStatusTone[column]}>{getTaskStatusLabel(column)}</Badge>
                <Badge className={priorityTone[task.priority]}>{getPriorityLabel(task.priority)}</Badge>
                <span className={cn("w-32 text-right text-[13px] font-semibold tabular-nums", due.late ? "text-danger" : "text-muted-foreground")}>
                  {due.text}
                </span>
                <div className="relative z-10">
                  <TaskCardActions task={task} projects={projects} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
