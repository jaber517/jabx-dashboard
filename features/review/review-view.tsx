"use client";

import Link from "next/link";
import { useTransition } from "react";
import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { MetricStrip } from "@/components/ui/metric-card";
import { PageHeader } from "@/components/ui/page-header";
import { useUndo } from "@/components/providers/undo-provider";
import { setTaskDone, setTaskDueDate, setTaskStatus } from "@/lib/actions";
import { categoryDot, categoryLabels, priorityTone } from "@/lib/constants";
import { addDays, dayKey, daysUntil, relativeDay, shortDate, todayKey, weekdayOf } from "@/lib/dates";
import { getPriorityLabel } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { TaskRecord } from "@/types";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function nextMonday(today: string) {
  const offset = (8 - WEEKDAYS.indexOf(weekdayOf(today))) % 7 || 7;
  return addDays(today, offset);
}

function TaskRow({ task, today, done = false }: { task: TaskRecord; today: string; done?: boolean }) {
  const [pending, startTransition] = useTransition();
  const { notify } = useUndo();
  const previousDue = task.dueDate ? dayKey(task.dueDate) : null;
  const previousStatus = task.blocked && task.status !== "DONE" ? "BLOCKED" : task.status;

  function reschedule(day: string, label: string) {
    startTransition(async () => {
      await setTaskDueDate(task.id, day);
      notify(`Moved “${task.title}” to ${label}`, () => startTransition(() => setTaskDueDate(task.id, previousDue)));
    });
  }

  function complete() {
    startTransition(async () => {
      await setTaskDone(task.id, true);
      notify(`Completed “${task.title}”`, () => startTransition(() => setTaskStatus(task.id, previousStatus)));
    });
  }

  const options = [
    { label: "Today", day: today },
    { label: "Tomorrow", day: addDays(today, 1) },
    { label: "Next Mon", day: nextMonday(today) },
    { label: "+1 week", day: addDays(previousDue && daysUntil(previousDue, today) >= 0 ? previousDue : today, 7) }
  ];

  return (
    <li className={cn("flex flex-col gap-3 border-b border-border px-5 py-4 last:border-b-0 sm:flex-row sm:items-center", pending && "opacity-60")}>
      <div className="min-w-0 flex-1">
        <Link href={`/tasks/${task.id}`} className="block truncate text-[15px] font-semibold hover:text-primary">
          {task.title}
        </Link>
        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className={cn("h-2 w-2 rounded-full", categoryDot[task.category])} aria-hidden="true" />
            {task.project?.title ?? categoryLabels[task.category]}
          </span>
          {done && task.completedAt ? <span>Done {relativeDay(task.completedAt, today).toLowerCase()}</span> : null}
          {!done && task.dueDate ? (
            <span className={cn(daysUntil(task.dueDate, today) < 0 && "font-semibold text-danger")}>
              {daysUntil(task.dueDate, today) < 0 ? `Was due ${shortDate(dayKey(task.dueDate), today)}` : `Due ${relativeDay(task.dueDate, today).toLowerCase()}`}
            </span>
          ) : null}
        </p>
      </div>
      {done ? (
        <Badge className={priorityTone[task.priority]}>{getPriorityLabel(task.priority)}</Badge>
      ) : (
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label={`Reschedule “${task.title}”`}>
          {options.map((option) => (
            <button
              key={option.label}
              type="button"
              disabled={pending || option.day === previousDue}
              onClick={() => reschedule(option.day, option.label === "+1 week" ? shortDate(option.day, today) : option.label.toLowerCase())}
              className="h-9 rounded-xl border border-border px-2.5 text-[13px] font-semibold transition-colors hover:border-primary disabled:opacity-40"
            >
              {option.label}
            </button>
          ))}
          <button
            type="button"
            disabled={pending}
            onClick={complete}
            aria-label={`Mark “${task.title}” done`}
            className="flex h-9 items-center gap-1.5 rounded-xl bg-primary-strong px-3 text-[13px] font-semibold text-primary-foreground hover:brightness-110 disabled:opacity-40"
          >
            <Check className="h-4 w-4" aria-hidden="true" />
            Done
          </button>
        </div>
      )}
    </li>
  );
}

function Section({
  id,
  title,
  note,
  tasks,
  today,
  done,
  empty
}: {
  id: string;
  title: string;
  note: string;
  tasks: TaskRecord[];
  today: string;
  done?: boolean;
  empty: string;
}) {
  return (
    <section aria-labelledby={id} className="overflow-hidden rounded-3xl border border-border bg-surface">
      <div className="flex items-baseline justify-between gap-4 border-b border-border px-5 py-4">
        <h2 id={id} className="text-[17px] font-bold tracking-tight">
          {title} <span className="ml-1 text-sm font-semibold tabular-nums text-muted-foreground">{tasks.length}</span>
        </h2>
        <p className="text-[13px] text-muted-foreground">{note}</p>
      </div>
      {tasks.length === 0 ? (
        <p className="px-5 py-6 text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul>
          {tasks.map((task) => (
            <TaskRow key={task.id} task={task} today={today} done={done} />
          ))}
        </ul>
      )}
    </section>
  );
}

const byDue = (a: TaskRecord, b: TaskRecord) => Date.parse(a.dueDate ?? "") - Date.parse(b.dueDate ?? "");

export function ReviewView({ tasks }: { tasks: TaskRecord[] }) {
  const today = todayKey();
  const weekAgo = addDays(today, -6);
  const open = tasks.filter((task) => task.status !== "DONE");

  const completed = tasks
    .filter((task) => task.status === "DONE" && task.completedAt && daysUntil(task.completedAt, weekAgo) >= 0)
    .sort((a, b) => Date.parse(b.completedAt ?? "") - Date.parse(a.completedAt ?? ""));
  const slipped = open.filter((task) => task.dueDate && daysUntil(task.dueDate, today) < 0).sort(byDue);
  const upcoming = open
    .filter((task) => task.dueDate && daysUntil(task.dueDate, today) >= 0 && daysUntil(task.dueDate, today) < 7)
    .sort(byDue);
  const undated = open.filter((task) => !task.dueDate);

  if (tasks.length === 0) {
    return (
      <div className="page-shell">
        <PageHeader eyebrow="Insight" title="Weekly review" />
        <EmptyState title="Nothing to review yet" description="Add some tasks and this page will sum up each week." actionLabel="Go to tasks" actionHref="/tasks" />
      </div>
    );
  }

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Insight"
        title="Weekly review"
        description={`${shortDate(weekAgo, today)} – ${shortDate(today, today)}. Close out what slipped, then set up the week ahead.`}
      />

      <MetricStrip
        metrics={[
          { label: "Completed", value: String(completed.length), note: "In the last 7 days" },
          { label: "Slipped", value: String(slipped.length), note: slipped.length ? "Past their due date" : "Nothing overdue" },
          { label: "Coming up", value: String(upcoming.length), note: "Due in the next 7 days" },
          { label: "No date", value: String(undated.length), note: "Open tasks without a due date" }
        ]}
      />

      <Section id="review-slipped" title="Slipped" note="Reschedule or finish" tasks={slipped} today={today} empty="Nothing slipped this week." />
      <Section id="review-upcoming" title="Coming up" note="The next 7 days" tasks={upcoming} today={today} empty="Nothing due in the next 7 days." />
      <Section id="review-undated" title="No date" note="Give these a day" tasks={undated} today={today} empty="Every open task has a due date." />
      <Section id="review-done" title="Completed" note="The last 7 days" tasks={completed} today={today} done empty="Nothing completed in the last 7 days yet." />
    </div>
  );
}
