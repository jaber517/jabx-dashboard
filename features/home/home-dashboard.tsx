import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  FileText,
  FolderKanban,
  ListTodo,
  Sparkles
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { MetricCard } from "@/components/ui/metric-card";
import { PageHeader } from "@/components/ui/page-header";
import { ProgressBar } from "@/components/ui/progress-bar";
import {
  categoryDot,
  priorityTone,
  quickActions,
  statusTone,
  taskStatusTone
} from "@/lib/constants";
import {
  formatDate,
  formatRelativeDate,
  getCategoryLabel,
  getPriorityLabel,
  getStatusLabel,
  getTaskStatusLabel
} from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type {
  ActivityRecord,
  MilestoneRecord,
  NoteRecord,
  ProjectRecord,
  ResourceRecord,
  TaskRecord
} from "@/types";

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
  const activeProjects = projects.filter((project) =>
    ["ACTIVE", "WAITING", "PLANNED"].includes(project.status)
  ).length;
  const openTasks = tasks.filter((task) => task.status !== "DONE").length;
  const blockedItems = tasks.filter((task) => task.blocked).length;
  const thisWeekDeadlineCount = milestones.filter((milestone) => {
    const date = new Date(milestone.date).getTime();
    const now = Date.now();
    const inWeek = now + 1000 * 60 * 60 * 24 * 7;
    return date >= now && date <= inWeek;
  }).length;

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Personal Dashboard"
        title="Jaber's Second Brain"
        description="Track operational projects, HSE actions, training plans, AI initiatives, and personal systems in one clean offline-first workspace."
        actions={
          <>
            <Link href="/projects" className={buttonVariants({ variant: "default", size: "lg" })}>
              Review Projects
            </Link>
            <Link href="/analytics" className={buttonVariants({ variant: "secondary", size: "lg" })}>
              Open Analytics
            </Link>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Active Projects"
          value={String(activeProjects)}
          trend="Execution pace is steady"
          icon={<FolderKanban className="h-5 w-5" />}
        />
        <MetricCard
          label="Open Tasks"
          value={String(openTasks)}
          trend={`${blockedItems} blocked items need review`}
          icon={<ListTodo className="h-5 w-5" />}
        />
        <MetricCard
          label="This Week"
          value={`${thisWeekDeadlineCount} deadlines`}
          trend="Focus window is visible"
          icon={<CalendarClock className="h-5 w-5" />}
        />
        <MetricCard
          label="Vault Notes"
          value={String(notes.length)}
          trend={`${resources.length} linked resources`}
          icon={<FileText className="h-5 w-5" />}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader className="flex-row items-end justify-between gap-4">
            <div>
              <CardTitle>Quick actions</CardTitle>
              <CardDescription>
                Fast entry points for planning, capture, and weekly review.
              </CardDescription>
            </div>
            <Badge className="bg-primary/10 text-primary">6 actions</Badge>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {quickActions.map((action) => (
              <Link
                key={action.title}
                href={action.href}
                className="group rounded-3xl border border-border bg-surface p-5 transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-soft"
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-base font-semibold">{action.title}</h3>
                  <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:text-primary" />
                </div>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {action.description}
                </p>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Execution snapshot</CardTitle>
            <CardDescription>
              A compact view of project health across the whole dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {projects.length === 0 ? (
              <EmptyState
                title="No projects loaded yet"
                description="Seed the database to load the starter OCC, HSE, Training, AI Projects, and Personal portfolio."
              />
            ) : (
              projects.slice(0, 4).map((project) => (
                <div key={project.id} className="rounded-2xl border border-border bg-surface p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={cn("h-2.5 w-2.5 rounded-full", categoryDot[project.category])} />
                        <p className="text-sm font-semibold">{project.title}</p>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {getCategoryLabel(project.category)}
                      </p>
                    </div>
                    <Badge className={statusTone[project.status]}>{getStatusLabel(project.status)}</Badge>
                  </div>
                  <ProgressBar value={project.progress} className="mt-4" />
                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{project.progress}% complete</span>
                    <span>{project.tasks?.length ?? 0} tasks</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader className="flex-row items-end justify-between gap-4">
            <div>
              <CardTitle>Focus projects</CardTitle>
              <CardDescription>
                The highest-signal initiatives currently shaping the week.
              </CardDescription>
            </div>
            <Link href="/projects" className={buttonVariants({ variant: "secondary", size: "sm" })}>
              View all
            </Link>
          </CardHeader>
          <CardContent className="grid gap-4">
            {projects.length === 0 ? (
              <EmptyState
                title="Your focus list is empty"
                description="Once projects are seeded or created, the most important items will appear here."
              />
            ) : (
              projects.slice(0, 5).map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="group rounded-3xl border border-border bg-surface p-5 transition hover:border-primary/30"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={statusTone[project.status]}>{getStatusLabel(project.status)}</Badge>
                    <Badge className={priorityTone[project.priority]}>{getPriorityLabel(project.priority)}</Badge>
                    <Badge className="bg-muted text-muted-foreground">
                      {getCategoryLabel(project.category)}
                    </Badge>
                  </div>
                  <div className="mt-4 flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold">{project.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {project.summary}
                      </p>
                    </div>
                    <Sparkles className="h-5 w-5 text-muted-foreground transition group-hover:text-primary" />
                  </div>
                  <ProgressBar value={project.progress} className="mt-5" />
                  <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    <span>{project.progress}% complete</span>
                    <span>{project.tasks?.length ?? 0} tasks</span>
                    <span>{project.notes?.length ?? 0} recent notes</span>
                    {project.dueDate ? <span>Due {formatDate(project.dueDate)}</span> : null}
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6">
          <Card>
            <CardHeader className="flex-row items-end justify-between gap-4">
              <div>
                <CardTitle>Upcoming deadlines</CardTitle>
                <CardDescription>
                  Planned checkpoints and near-term milestones.
                </CardDescription>
              </div>
              <Link href="/calendar" className={buttonVariants({ variant: "secondary", size: "sm" })}>
                View calendar
              </Link>
            </CardHeader>
            <CardContent className="space-y-4">
              {milestones.length === 0 ? (
                <EmptyState
                  title="No deadlines scheduled"
                  description="Upcoming milestones and delivery checkpoints will surface here."
                />
              ) : (
                milestones.slice(0, 5).map((milestone) => (
                  <div key={milestone.id} className="rounded-2xl border border-border bg-surface p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold">{milestone.title}</p>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">
                          {milestone.summary}
                        </p>
                      </div>
                      <Badge className={statusTone[milestone.status]}>{getStatusLabel(milestone.status)}</Badge>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{getCategoryLabel(milestone.category)}</span>
                      <span>{formatDate(milestone.date)}</span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent activity</CardTitle>
              <CardDescription>
                Recent updates across projects, tasks, and notes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {activities.length === 0 ? (
                <EmptyState
                  title="No recent activity"
                  description="As projects and tasks change, the latest updates will show up here."
                />
              ) : (
                activities.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex gap-3 rounded-2xl border border-border bg-surface p-4">
                    <span
                      className={cn("mt-2 h-2.5 w-2.5 shrink-0 rounded-full", categoryDot[activity.category])}
                    />
                    <div>
                      <p className="text-sm font-semibold">{activity.action}</p>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        {activity.description}
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {formatRelativeDate(activity.createdAt)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader className="flex-row items-end justify-between gap-4">
          <div>
            <CardTitle>Task radar</CardTitle>
            <CardDescription>
              See what needs attention before it impacts momentum.
            </CardDescription>
          </div>
          <Link href="/tasks" className={buttonVariants({ variant: "secondary", size: "sm" })}>
            Open task board
          </Link>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {tasks.length === 0 ? (
            <EmptyState
              title="No tasks available"
              description="The task radar will populate once tasks are seeded or added to the workspace."
            />
          ) : (
            tasks.slice(0, 6).map((task) => (
              <div key={task.id} className="rounded-3xl border border-border bg-surface p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={taskStatusTone[task.status]}>{getTaskStatusLabel(task.status)}</Badge>
                  <Badge className={priorityTone[task.priority]}>{getPriorityLabel(task.priority)}</Badge>
                </div>
                <h3 className="mt-4 text-base font-semibold">{task.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{task.description}</p>
                <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span>{getCategoryLabel(task.category)}</span>
                  {task.project ? <span>{task.project.title}</span> : null}
                  {task.dueDate ? <span>Due {formatDate(task.dueDate)}</span> : null}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
