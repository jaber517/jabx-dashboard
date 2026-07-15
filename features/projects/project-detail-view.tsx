import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { ProgressBar } from "@/components/ui/progress-bar";
import { TaskStatusIcon } from "@/components/ui/task-status-icon";
import { categoryLabels, priorityTone, statusTone, taskStatusTone } from "@/lib/constants";
import {
  formatDate,
  formatRelativeDate,
  getPriorityLabel,
  getStatusLabel,
  getTaskStatusLabel
} from "@/lib/formatters";
import type { ProjectRecord } from "@/types";
import { ProjectCardActions } from "@/features/projects/project-card-actions";

export function ProjectDetailView({ project }: { project: ProjectRecord }) {
  const doneTasks = project.tasks?.filter((task) => task.status === "DONE").length ?? 0;
  const totalTasks = project.tasks?.length ?? 0;

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow={categoryLabels[project.category]}
        title={project.title}
        description={project.description}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/projects" className={buttonVariants({ variant: "secondary", size: "lg" })}>
              All projects
            </Link>
            <ProjectCardActions project={project} />
          </div>
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
            <span className="font-semibold text-foreground">{project.progress}% complete</span>
            <span>Updated {formatRelativeDate(project.updatedAt)}</span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {project.status === "COMPLETED"
              ? "Marked completed."
              : totalTasks > 0
                ? `Based on ${doneTasks} of ${totalTasks} tasks done.`
                : "Add tasks to track progress automatically."}
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-border bg-surface p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Tasks</p>
              <p className="mt-2 text-2xl font-semibold">{totalTasks}</p>
            </div>
            <div className="rounded-2xl border border-border bg-surface p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Notes</p>
              <p className="mt-2 text-2xl font-semibold">{project.notes?.length ?? 0}</p>
            </div>
            <div className="rounded-2xl border border-border bg-surface p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Resources</p>
              <p className="mt-2 text-2xl font-semibold">{project.resources?.length ?? 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Tasks</CardTitle>
            <CardDescription>Delivery items attached to this project.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {totalTasks === 0 ? (
              <EmptyState title="No tasks yet" description="Add tasks and link them to this project." />
            ) : (
              project.tasks?.map((task) => (
                <Link
                  key={task.id}
                  href={`/tasks/${task.id}`}
                  className="block rounded-2xl border border-border bg-surface p-4 transition hover:border-primary/30"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5">
                      <TaskStatusIcon status={task.status} />
                      <Badge className={taskStatusTone[task.status]}>{getTaskStatusLabel(task.status)}</Badge>
                    </span>
                    <Badge className={priorityTone[task.priority]}>{getPriorityLabel(task.priority)}</Badge>
                  </div>
                  <p className="mt-3 text-sm font-semibold">{task.title}</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{task.description}</p>
                  <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
                    {task.dueDate ? <span>Due {formatDate(task.dueDate)}</span> : null}
                    {task.blocked ? <span>Blocked</span> : null}
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
              <CardDescription>Supporting context and project ideas.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {(project.notes?.length ?? 0) === 0 ? (
                <EmptyState title="No notes yet" description="Notes linked to this project appear here." />
              ) : (
                project.notes?.map((note) => (
                  <Link
                    key={note.id}
                    href={`/notes/${note.id}`}
                    className="block rounded-2xl border border-border bg-surface p-4 transition hover:border-primary/30"
                  >
                    <p className="text-sm font-semibold">{note.title}</p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground line-clamp-3">{note.content}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {note.tags.map((tag) => (
                        <Badge key={tag} className="bg-muted text-muted-foreground">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resources</CardTitle>
              <CardDescription>Links and references for this project.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {(project.resources?.length ?? 0) === 0 ? (
                <EmptyState title="No resources yet" description="Add links on the Resources page and attach this project." />
              ) : (
                project.resources?.map((resource) => (
                  <a
                    key={resource.id}
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-2xl border border-border bg-surface p-4 transition hover:border-primary/30"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold">{resource.title}</p>
                      <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </div>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{resource.description}</p>
                    <p className="mt-2 text-xs text-muted-foreground">{resource.type}</p>
                  </a>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
