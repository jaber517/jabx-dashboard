import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { ProgressBar } from "@/components/ui/progress-bar";
import { categoryLabels, priorityTone, statusTone, taskStatusTone } from "@/lib/constants";
import {
  formatDate,
  formatRelativeDate,
  getPriorityLabel,
  getStatusLabel,
  getTaskStatusLabel
} from "@/lib/formatters";
import type { ProjectRecord } from "@/types";

export function ProjectDetailView({ project }: { project: ProjectRecord }) {
  return (
    <div className="page-shell">
      <PageHeader
        eyebrow={categoryLabels[project.category]}
        title={project.title}
        description={project.description}
        actions={
          <>
            <Link href="/projects" className={buttonVariants({ variant: "secondary", size: "lg" })}>
              All projects
            </Link>
            <Link href="/tasks" className={buttonVariants({ variant: "default", size: "lg" })}>
              View tasks
            </Link>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>Status</CardDescription>
            <CardTitle>{getStatusLabel(project.status)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Priority</CardDescription>
            <CardTitle>{getPriorityLabel(project.priority)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Owner</CardDescription>
            <CardTitle>{project.owner ?? "Unassigned"}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Due date</CardDescription>
            <CardTitle>{project.dueDate ? formatDate(project.dueDate) : "Not set"}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={statusTone[project.status]}>{getStatusLabel(project.status)}</Badge>
              <Badge className={priorityTone[project.priority]}>{getPriorityLabel(project.priority)}</Badge>
              <Badge className="bg-muted text-muted-foreground">
                {categoryLabels[project.category]}
              </Badge>
            </div>
            <CardTitle className="mt-2">Progress and delivery</CardTitle>
            <CardDescription>{project.summary}</CardDescription>
          </CardHeader>
          <CardContent>
            <ProgressBar value={project.progress} />
            <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
              <span>{project.progress}% complete</span>
              <span>Updated {formatRelativeDate(project.updatedAt)}</span>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-border bg-surface p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Tasks</p>
                <p className="mt-2 text-2xl font-semibold">{project.tasks?.length ?? 0}</p>
              </div>
              <div className="rounded-2xl border border-border bg-surface p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Notes</p>
                <p className="mt-2 text-2xl font-semibold">{project.notes?.length ?? 0}</p>
              </div>
              <div className="rounded-2xl border border-border bg-surface p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Milestones</p>
                <p className="mt-2 text-2xl font-semibold">{project.milestones?.length ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Milestones</CardTitle>
            <CardDescription>Key upcoming checkpoints for this project.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {project.milestones?.map((milestone) => (
              <div key={milestone.id} className="rounded-2xl border border-border bg-surface p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{milestone.title}</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      {milestone.summary}
                    </p>
                  </div>
                  <Badge className={statusTone[milestone.status]}>{getStatusLabel(milestone.status)}</Badge>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">{formatDate(milestone.date)}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Tasks</CardTitle>
            <CardDescription>Delivery items attached to this project.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {project.tasks?.map((task) => (
              <div key={task.id} className="rounded-2xl border border-border bg-surface p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={taskStatusTone[task.status]}>{getTaskStatusLabel(task.status)}</Badge>
                  <Badge className={priorityTone[task.priority]}>{getPriorityLabel(task.priority)}</Badge>
                </div>
                <p className="mt-3 text-sm font-semibold">{task.title}</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{task.description}</p>
                <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
                  {task.dueDate ? <span>Due {formatDate(task.dueDate)}</span> : null}
                  {task.blocked ? <span>Blocked</span> : null}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
              <CardDescription>Supporting context and project ideas.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {project.notes?.map((note) => (
                <div key={note.id} className="rounded-2xl border border-border bg-surface p-4">
                  <p className="text-sm font-semibold">{note.title}</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{note.content}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {note.tags.map((tag) => (
                      <Badge key={tag} className="bg-muted text-muted-foreground">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resources and activity</CardTitle>
              <CardDescription>Linked references and recent changes.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {project.resources?.map((resource) => (
                <a
                  key={resource.id}
                  href={resource.url}
                  className="block rounded-2xl border border-border bg-surface p-4 transition hover:border-primary/30"
                >
                  <p className="text-sm font-semibold">{resource.title}</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{resource.description}</p>
                </a>
              ))}
              {project.activities?.map((activity) => (
                <div key={activity.id} className="rounded-2xl border border-border bg-surface p-4">
                  <p className="text-sm font-semibold">{activity.action}</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{activity.description}</p>
                  <p className="mt-3 text-xs text-muted-foreground">{formatRelativeDate(activity.createdAt)}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
