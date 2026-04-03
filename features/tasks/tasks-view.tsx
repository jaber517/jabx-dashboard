"use client";

import { useDeferredValue, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { categoryLabels, priorityTone, taskStatusTone } from "@/lib/constants";
import { formatDate, getPriorityLabel, getTaskStatusLabel } from "@/lib/formatters";
import { PROJECT_CATEGORIES, TASK_PRIORITIES, TASK_STATUSES } from "@/types";
import type { TaskRecord } from "@/types";

export function TasksView({
  tasks,
  initialStatus = "ALL"
}: {
  tasks: TaskRecord[];
  initialStatus?: string;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("ALL");
  const [priority, setPriority] = useState("ALL");
  const [status, setStatus] = useState(initialStatus);
  const deferredQuery = useDeferredValue(query);

  const filteredTasks = tasks.filter((task) => {
    const matchesQuery =
      deferredQuery.length === 0 ||
      task.title.toLowerCase().includes(deferredQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(deferredQuery.toLowerCase());

    return (
      matchesQuery &&
      (category === "ALL" || task.category === category) &&
      (priority === "ALL" || task.priority === priority) &&
      (status === "ALL" || task.status === status)
    );
  });

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Execution"
        title="Tasks"
        description="Track due dates, blockers, priorities, and project-linked execution work from one structured board."
      />

      <Card>
        <CardHeader>
          <CardTitle>Task filters</CardTitle>
          <CardDescription>
            Focus on what matters by filtering status, category, and urgency.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search tasks..." />
          <Select value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="ALL">All categories</option>
            {PROJECT_CATEGORIES.map((item) => (
              <option key={item} value={item}>
                {categoryLabels[item]}
              </option>
            ))}
          </Select>
          <Select value={priority} onChange={(event) => setPriority(event.target.value)}>
            <option value="ALL">All priorities</option>
            {TASK_PRIORITIES.map((item) => (
              <option key={item} value={item}>
                {getPriorityLabel(item)}
              </option>
            ))}
          </Select>
          <Select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="ALL">All statuses</option>
            {TASK_STATUSES.map((item) => (
              <option key={item} value={item}>
                {getTaskStatusLabel(item)}
              </option>
            ))}
          </Select>
        </CardContent>
      </Card>

      {filteredTasks.length === 0 ? (
        <EmptyState
          title="No tasks match the current view"
          description="Adjust the filters or search terms to bring tasks back into the board."
        />
      ) : (
        <div className="grid gap-4">
          {filteredTasks.map((task) => (
            <Card key={task.id}>
              <CardContent className="mt-0 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="max-w-3xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={taskStatusTone[task.status]}>{getTaskStatusLabel(task.status)}</Badge>
                    <Badge className={priorityTone[task.priority]}>{getPriorityLabel(task.priority)}</Badge>
                    <Badge className="bg-muted text-muted-foreground">
                      {categoryLabels[task.category]}
                    </Badge>
                    {task.blocked ? <Badge className="bg-danger/10 text-danger">Blocked</Badge> : null}
                  </div>
                  <h2 className="mt-4 text-lg font-semibold">{task.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{task.description}</p>
                </div>
                <div className="grid min-w-[220px] gap-3 rounded-2xl border border-border bg-surface p-4 text-sm">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">Due date</span>
                    <span>{task.dueDate ? formatDate(task.dueDate) : "Not set"}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">Project</span>
                    <span className="text-right">{task.project?.title ?? "Standalone"}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
