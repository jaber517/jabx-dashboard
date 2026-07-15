import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { categoryLabels, priorityTone, taskStatusTone } from "@/lib/constants";
import { formatDate, formatRelativeDate, getPriorityLabel, getTaskStatusLabel } from "@/lib/formatters";
import type { TaskRecord } from "@/types";
import { TaskCardActions } from "@/features/tasks/task-card-actions";

export function TaskDetailView({
  task,
  projects
}: {
  task: TaskRecord;
  projects: { id: string; title: string }[];
}) {
  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Task"
        title={task.title}
        description={task.description}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/tasks" className={buttonVariants({ variant: "secondary", size: "lg" })}>
              All tasks
            </Link>
            <TaskCardActions task={task} projects={projects} />
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={taskStatusTone[task.status]}>{getTaskStatusLabel(task.status)}</Badge>
              <Badge className={priorityTone[task.priority]}>{getPriorityLabel(task.priority)}</Badge>
              <Badge className="bg-muted text-muted-foreground">{categoryLabels[task.category]}</Badge>
              {task.blocked ? <Badge className="bg-danger/10 text-danger">Blocked</Badge> : null}
            </div>
            <CardTitle className="mt-2">Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-6 text-muted-foreground">{task.description}</p>
            {task.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={task.imageUrl}
                alt=""
                className="max-h-80 rounded-2xl border border-border object-cover"
              />
            ) : null}
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
            <CardDescription>Key facts about this task.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Due date</span>
              <span>{task.dueDate ? formatDate(task.dueDate) : "Not set"}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Project</span>
              {task.project ? (
                <Link href={`/projects/${task.project.id}`} className="text-right text-primary hover:underline">
                  {task.project.title}
                </Link>
              ) : (
                <span className="text-right">Independent task</span>
              )}
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Last updated</span>
              <span>{formatRelativeDate(task.updatedAt)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
