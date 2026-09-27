import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { MetricStrip } from "@/components/ui/metric-card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { TaskFormDialog } from "@/features/tasks/create-task-dialog";
import { CustomizableGrid, type HomeSection } from "@/features/home/customizable-grid";
import { Greeting } from "@/features/home/greeting";
import { NextUpTask } from "@/features/home/next-up-task";
import { categoryDot, priorityTone, statusTone } from "@/lib/constants";
import { formatRelativeDate, getCategoryLabel, getPriorityLabel, getStatusLabel } from "@/lib/formatters";
import { dayKey, daysUntil, relativeDay, todayKey, weekdayOf } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type {
  ActivityRecord,
  MilestoneRecord,
  NoteRecord,
  ProjectRecord,
  ResourceRecord,
  TaskRecord
} from "@/types";

const priorityRank = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 } as const;

function Panel({
  id,
  title,
  link,
  children
}: {
  id: string;
  title: string;
  link?: { href: string; label: string };
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="overflow-hidden rounded-3xl border border-border bg-surface">
      <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-4">
        <h2 id={id} className="text-[17px] font-bold tracking-tight">
          {title}
        </h2>
        {link ? (
          <Link href={link.href} className="text-sm font-semibold text-primary hover:underline">
            {link.label}
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export function HomeDashboard({
  projects,
  tasks,
  notes,
  activities,
  milestones,
  resources
}: {
  projects: ProjectRecord[];
  tasks: TaskRecord[];
  notes: NoteRecord[];
  activities: ActivityRecord[];
  milestones: MilestoneRecord[];
  resources: ResourceRecord[];
}) {
  const today = todayKey();
  const openTasks = tasks.filter((task) => task.status !== "DONE");
  const activeProjects = projects.filter((project) => ["ACTIVE", "WAITING", "PLANNED"].includes(project.status));
  const blockedCount = openTasks.filter((task) => task.blocked || task.status === "BLOCKED").length;
  const waitingCount = projects.filter((project) => project.status === "WAITING").length;

  const dueThisWeek = openTasks.filter((task) => {
    if (!task.dueDate) return false;
    const days = daysUntil(task.dueDate, today);
    return days >= 0 && days < 7;
  });

  // Open tasks, soonest due first (undated last), then by priority.
  const nextUp = [...openTasks]
    .sort((a, b) => {
      const aDue = a.dueDate ? Date.parse(a.dueDate) : Infinity;
      const bDue = b.dueDate ? Date.parse(b.dueDate) : Infinity;
      return aDue - bDue || priorityRank[a.priority] - priorityRank[b.priority];
    })
    .slice(0, 5);

  // Everything dated in the next 7 days: projects, open tasks and milestones.
  const thisWeek = [
    ...projects
      .filter((project) => project.dueDate)
      .map((project) => ({ id: `p-${project.id}`, kind: "Project due", title: project.title, context: getCategoryLabel(project.category), href: `/projects/${project.id}`, date: project.dueDate as string })),
    ...openTasks
      .filter((task) => task.dueDate)
      .map((task) => ({ id: `t-${task.id}`, kind: "Task", title: task.title, context: task.project?.title ?? getCategoryLabel(task.category), href: `/tasks/${task.id}`, date: task.dueDate as string })),
    ...milestones.map((milestone) => ({ id: `m-${milestone.id}`, kind: "Milestone", title: milestone.title, context: milestone.project?.title ?? getCategoryLabel(milestone.category), href: milestone.projectId ? `/projects/${milestone.projectId}` : "/calendar", date: milestone.date }))
  ]
    .filter((item) => {
      const days = daysUntil(item.date, today);
      return days >= 0 && days < 7;
    })
    .sort((a, b) => Date.parse(a.date) - Date.parse(b.date))
    .slice(0, 5);

  const nextDeadline = dueThisWeek
    .map((task) => task.dueDate as string)
    .sort((a, b) => Date.parse(a) - Date.parse(b))[0];

  const sections: HomeSection[] = [
    {
      id: "metrics",
      title: "Overview",
      defaultWidth: "full",
      node: (
        <MetricStrip
          metrics={[
            { label: "Active projects", value: String(activeProjects.length), note: waitingCount ? `${waitingCount} waiting` : "None waiting", href: "/projects" },
            { label: "Open tasks", value: String(openTasks.length), note: blockedCount ? `${blockedCount} blocked` : "Nothing blocked", href: "/tasks" },
            { label: "Due this week", value: String(dueThisWeek.length), note: nextDeadline ? `Next: ${relativeDay(nextDeadline, today)}` : "Nothing due", href: "/calendar" },
            { label: "Notes", value: String(notes.length), note: `${resources.length} linked resources`, href: "/notes" }
          ]}
        />
      )
    },
    {
      id: "next-up",
      title: "Next up",
      defaultWidth: "half",
      node: (
        <Panel id="home-next-up" title="Next up" link={{ href: "/tasks", label: "Open tasks" }}>
          {nextUp.length === 0 ? (
            <div className="p-5">
              <EmptyState title="Nothing open" description="New tasks will line up here, soonest due first." />
            </div>
          ) : (
            <ul>
              {nextUp.map((task) => {
                const days = task.dueDate ? daysUntil(task.dueDate, today) : null;
                return (
                  <NextUpTask
                    key={task.id}
                    id={task.id}
                    title={task.title}
                    meta={task.project?.title ?? getCategoryLabel(task.category)}
                    dot={categoryDot[task.category]}
                    due={task.dueDate ? relativeDay(task.dueDate, today) : undefined}
                    overdue={days !== null && days <= 0}
                    priority={{ label: getPriorityLabel(task.priority), tone: priorityTone[task.priority] }}
                    previousStatus={task.blocked ? "BLOCKED" : task.status}
                    repeat={task.repeat}
                  />
                );
              })}
            </ul>
          )}
        </Panel>
      )
    },
    {
      id: "this-week",
      title: "This week",
      defaultWidth: "half",
      node: (
        <Panel id="home-this-week" title="This week" link={{ href: "/calendar", label: "Calendar" }}>
          {thisWeek.length === 0 ? (
            <div className="p-5">
              <EmptyState title="A clear week" description="Anything due in the next seven days shows up here." />
            </div>
          ) : (
            <ul className="p-2">
              {thisWeek.map((item) => {
                const key = dayKey(item.date);
                return (
                  <li key={item.id}>
                    <Link href={item.href} className="flex items-center gap-3.5 rounded-2xl p-2.5 transition-colors hover:bg-muted/60">
                      <span className="w-12 shrink-0 rounded-xl border border-border bg-background py-1 text-center">
                        <span className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{weekdayOf(key)}</span>
                        <span className="block text-lg font-extrabold tabular-nums">{Number(key.slice(8))}</span>
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold">{item.title}</span>
                        <span className="mt-0.5 block truncate text-[13px] text-muted-foreground">
                          {item.kind} · {item.context}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      )
    },
    {
      id: "projects",
      title: "Projects",
      defaultWidth: "half",
      node: (
        <Panel id="home-projects" title="Projects" link={{ href: "/projects", label: "All projects" }}>
          {activeProjects.length === 0 ? (
            <div className="p-5">
              <EmptyState title="No active projects" description="Create a project to track its progress here." actionLabel="Go to projects" actionHref="/projects" />
            </div>
          ) : (
            <ul>
              {activeProjects.slice(0, 5).map((project) => (
                <li key={project.id} className="border-b border-border last:border-b-0">
                  <Link href={`/projects/${project.id}`} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 px-5 py-3.5 transition-colors hover:bg-muted/60 sm:grid-cols-[minmax(0,1fr)_6rem_7.5rem]">
                    <span className="flex min-w-0 items-center gap-2.5 text-sm font-semibold">
                      <span className={cn("h-2 w-2 shrink-0 rounded-full", categoryDot[project.category])} aria-hidden="true" />
                      <span className="truncate">{project.title}</span>
                    </span>
                    <Badge className={cn("justify-self-end sm:justify-self-start", statusTone[project.status])}>{getStatusLabel(project.status)}</Badge>
                    <span className="col-span-2 flex items-center gap-2.5 sm:col-span-1">
                      <ProgressBar value={project.progress} className="flex-1" />
                      <span className="w-9 text-right text-[13px] tabular-nums text-muted-foreground">{project.progress}%</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      )
    },
    {
      id: "activity",
      title: "Recent activity",
      defaultWidth: "half",
      node: (
        <Panel id="home-activity" title="Recent activity" link={{ href: "/activity", label: "All activity" }}>
          {activities.length === 0 ? (
            <div className="p-5">
              <EmptyState title="No recent activity" description="Changes to projects, tasks and notes will show up here." />
            </div>
          ) : (
            <ul className="px-5 py-2">
              {activities.slice(0, 5).map((activity) => (
                <li key={activity.id} className="flex gap-3 py-2.5">
                  <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", categoryDot[activity.category])} aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="text-sm">
                      <span className="font-semibold">{activity.action}</span>{" "}
                      <span className="text-muted-foreground">{activity.description}</span>
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{formatRelativeDate(activity.createdAt)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      )
    }
  ];

  return (
    <div className="page-shell">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Greeting name="Jaber" />
          <p className="mt-2 text-[15px] text-muted-foreground">Life is too short to remember what you had for lunch.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/review" className={buttonVariants({ variant: "secondary" })}>
            Review week
          </Link>
          <TaskFormDialog projects={projects.map((project) => ({ id: project.id, title: project.title }))} />
        </div>
      </header>

      <CustomizableGrid sections={sections} />
    </div>
  );
}
