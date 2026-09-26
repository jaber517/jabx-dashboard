"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useState } from "react";
import { differenceInCalendarDays, format, startOfDay } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { TaskStatusIcon } from "@/components/ui/task-status-icon";
import { categoryDot, categoryLabels, priorityTone, taskStatusTone } from "@/lib/constants";
import { getPriorityLabel, getTaskStatusLabel } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { PROJECT_CATEGORIES, TASK_PRIORITIES, TASK_STATUSES } from "@/types";
import type { TaskRecord, TaskStatus } from "@/types";
import { CreateTaskDialog } from "@/features/tasks/create-task-dialog";
import { TaskCardActions } from "@/features/tasks/task-card-actions";

type Quick = "ALL" | "WEEK" | "BLOCKED" | "HIGH";
type View = "board" | "list";

const quickFilters: { id: Quick; label: string }[] = [
  { id: "ALL", label: "All" },
  { id: "WEEK", label: "Due this week" },
  { id: "BLOCKED", label: "Blocked" },
  { id: "HIGH", label: "High priority" }
];

const VIEW_KEY = "tasks-view";

// A task flagged as blocked sits in the Blocked column whatever its status.
function columnOf(task: TaskRecord): TaskStatus {
  return task.blocked && task.status !== "DONE" ? "BLOCKED" : task.status;
}

function dueText(task: TaskRecord, today: Date) {
  if (!task.dueDate) return { text: "No date", late: false };
  const due = new Date(task.dueDate);
  const days = differenceInCalendarDays(due, today);
  if (task.status === "DONE") return { text: format(due, "d MMM"), late: false };
  if (days < 0) return { text: `Overdue · ${format(due, "d MMM")}`, late: true };
  if (days === 0) return { text: "Today", late: true };
  if (days === 1) return { text: "Tomorrow", late: false };
  return { text: format(due, days < 7 ? "EEE d MMM" : "d MMM"), late: false };
}

function ProjectLine({ task }: { task: TaskRecord }) {
  return (
    <span className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
      <span className={cn("h-2 w-2 shrink-0 rounded-full", categoryDot[task.category])} aria-hidden="true" />
      <span className="truncate">{task.project?.title ?? categoryLabels[task.category]}</span>
    </span>
  );
}

export function TasksView({
  tasks,
  projects = [],
  initialStatus = "ALL"
}: {
  tasks: TaskRecord[];
  projects?: { id: string; title: string }[];
  initialStatus?: string;
}) {
  const [query, setQuery] = useState("");
  const [quick, setQuick] = useState<Quick>(initialStatus === "BLOCKED" ? "BLOCKED" : "ALL");
  const [status, setStatus] = useState(initialStatus === "BLOCKED" ? "ALL" : initialStatus);
  const [category, setCategory] = useState("ALL");
  const [project, setProject] = useState("ALL");
  const [sort, setSort] = useState("DUE");
  const [view, setView] = useState<View>("board");
  const deferredQuery = useDeferredValue(query);
  const today = startOfDay(new Date());

  useEffect(() => {
    try {
      if (localStorage.getItem(VIEW_KEY) === "list") setView("list");
    } catch {
      /* storage unavailable */
    }
  }, []);

  function chooseView(next: View) {
    setView(next);
    try {
      localStorage.setItem(VIEW_KEY, next);
    } catch {
      /* storage unavailable */
    }
  }

  const q = deferredQuery.trim().toLowerCase();
  const filtered = tasks.filter((task) => {
    if (q && !task.title.toLowerCase().includes(q) && !task.description.toLowerCase().includes(q)) return false;
    if (category !== "ALL" && task.category !== category) return false;
    if (status !== "ALL" && task.status !== status) return false;
    if (project !== "ALL" && (project === "INDEPENDENT" ? task.projectId : task.projectId !== project)) return false;
    if (quick === "BLOCKED" && columnOf(task) !== "BLOCKED") return false;
    if (quick === "HIGH" && task.priority !== "CRITICAL" && task.priority !== "HIGH") return false;
    if (quick === "WEEK") {
      if (!task.dueDate || task.status === "DONE") return false;
      const days = differenceInCalendarDays(new Date(task.dueDate), today);
      if (days < 0 || days > 6) return false;
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    switch (sort) {
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

  const chip = (active: boolean) =>
    cn(
      "h-9 rounded-full border px-3.5 text-[13px] font-semibold transition-colors",
      active ? "border-primary bg-muted text-foreground" : "border-border text-muted-foreground hover:text-foreground"
    );

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
                onClick={() => setQuick(filter.id)}
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
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search tasks…" aria-label="Search tasks" className="h-10" />
          <Select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Category" className="h-10">
            <option value="ALL">All categories</option>
            {PROJECT_CATEGORIES.map((item) => (
              <option key={item} value={item}>{categoryLabels[item]}</option>
            ))}
          </Select>
          <Select value={project} onChange={(event) => setProject(event.target.value)} aria-label="Project" className="h-10">
            <option value="ALL">All projects</option>
            <option value="INDEPENDENT">Independent tasks</option>
            {projects.map((item) => (
              <option key={item.id} value={item.id}>{item.title}</option>
            ))}
          </Select>
          <Select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Status" className="h-10">
            <option value="ALL">All statuses</option>
            {TASK_STATUSES.map((item) => (
              <option key={item} value={item}>{getTaskStatusLabel(item)}</option>
            ))}
          </Select>
          <Select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort" className="h-10">
            <option value="DUE">Sort: Due date</option>
            <option value="PRIORITY">Sort: Priority</option>
            <option value="RECENT">Sort: Recently updated</option>
            <option value="TITLE">Sort: Title A–Z</option>
          </Select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No tasks match" description="Change the filters or search to bring tasks back." />
      ) : view === "board" ? (
        <div className="grid gap-4 md:grid-cols-2 min-[1360px]:grid-cols-4">
          {TASK_STATUSES.map((column) => {
            const columnTasks = sorted.filter((task) => columnOf(task) === column);
            return (
              <section
                key={column}
                aria-label={getTaskStatusLabel(column)}
                className="flex flex-col gap-2.5 rounded-3xl border border-border bg-background/60 p-3 dark:bg-[#0B1824]"
              >
                <div className="flex items-center gap-2 px-1.5 py-1">
                  <span className={cn("h-2 w-2 rounded-full bg-current", taskStatusTone[column])} aria-hidden="true" />
                  <h2 className="flex-1 text-sm font-bold">{getTaskStatusLabel(column)}</h2>
                  <span className="text-[13px] font-semibold tabular-nums text-muted-foreground">{columnTasks.length}</span>
                </div>
                {columnTasks.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-border px-3 py-6 text-center text-[13px] text-muted-foreground">
                    Nothing here
                  </p>
                ) : (
                  columnTasks.map((task) => {
                    const due = dueText(task, today);
                    return (
                      <article key={task.id} className="group relative flex flex-col gap-2.5 rounded-2xl border border-border bg-surface p-3.5 transition-colors hover:border-primary">
                        <Link href={`/tasks/${task.id}`} className="text-sm font-semibold leading-snug after:absolute after:inset-0 after:rounded-2xl">
                          {task.title}
                        </Link>
                        <ProjectLine task={task} />
                        {task.blocked && task.description ? (
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
                  })
                )}
              </section>
            );
          })}
        </div>
      ) : (
        <ul className="overflow-hidden rounded-3xl border border-border bg-surface">
          {sorted.map((task) => {
            const due = dueText(task, today);
            return (
              <li key={task.id} className="relative flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-border px-5 py-3.5 last:border-b-0 hover:bg-muted/40">
                <TaskStatusIcon status={columnOf(task)} className="shrink-0" />
                <div className="min-w-0 flex-1 basis-60">
                  <Link href={`/tasks/${task.id}`} className="block truncate text-[15px] font-semibold after:absolute after:inset-0">
                    {task.title}
                  </Link>
                  <ProjectLine task={task} />
                </div>
                <Badge className={taskStatusTone[columnOf(task)]}>{getTaskStatusLabel(columnOf(task))}</Badge>
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
