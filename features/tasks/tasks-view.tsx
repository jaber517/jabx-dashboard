"use client";

import Link from "next/link";
import { useDeferredValue, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { FilterBadge } from "@/components/ui/filter-badge";
import { TaskStatusIcon } from "@/components/ui/task-status-icon";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { categoryLabels, priorityTone, taskStatusTone } from "@/lib/constants";
import { formatDate, getPriorityLabel, getTaskStatusLabel } from "@/lib/formatters";
import { PROJECT_CATEGORIES, TASK_PRIORITIES, TASK_STATUSES } from "@/types";
import type { TaskRecord } from "@/types";
import { CreateTaskDialog } from "@/features/tasks/create-task-dialog";
import { TaskCardActions } from "@/features/tasks/task-card-actions";

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
  const [category, setCategory] = useState("ALL");
  const [priority, setPriority] = useState("ALL");
  const [status, setStatus] = useState(initialStatus);
  const [project, setProject] = useState("ALL");
  const [sort, setSort] = useState("RECENT");
  const deferredQuery = useDeferredValue(query);

  const filteredTasks = tasks.filter((task) => {
    const matchesQuery =
      deferredQuery.length === 0 ||
      task.title.toLowerCase().includes(deferredQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(deferredQuery.toLowerCase());

    const matchesProject =
      project === "ALL" ||
      (project === "INDEPENDENT" ? !task.projectId : task.projectId === project);

    return (
      matchesQuery &&
      (category === "ALL" || task.category === category) &&
      (priority === "ALL" || task.priority === priority) &&
      (status === "ALL" || task.status === status) &&
      matchesProject
    );
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    switch (sort) {
      case "TITLE":
        return a.title.localeCompare(b.title);
      case "DUE":
        return (
          (a.dueDate ? Date.parse(a.dueDate) : Infinity) -
          (b.dueDate ? Date.parse(b.dueDate) : Infinity)
        );
      case "PRIORITY":
        return TASK_PRIORITIES.indexOf(a.priority) - TASK_PRIORITIES.indexOf(b.priority);
      default:
        return Date.parse(b.updatedAt) - Date.parse(a.updatedAt);
    }
  });

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Execution"
        title="Tasks"
        description="Track due dates, blockers, priorities, and project-linked execution work from one structured board."
        actions={<CreateTaskDialog projects={projects} />}
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
          <Select value={project} onChange={(event) => setProject(event.target.value)}>
            <option value="ALL">All projects</option>
            <option value="INDEPENDENT">Independent tasks</option>
            {projects.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </Select>
          <Select value={sort} onChange={(event) => setSort(event.target.value)}>
            <option value="RECENT">Sort: Newest first</option>
            <option value="TITLE">Sort: Title A–Z</option>
            <option value="DUE">Sort: Due date</option>
            <option value="PRIORITY">Sort: Priority</option>
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
          {sortedTasks.map((task) => (
            <Card key={task.id} className="relative">
              <Link
                href={`/tasks/${task.id}`}
                aria-label={task.title}
                className="absolute inset-0 z-0 rounded-3xl"
              />
              <CardContent className="pointer-events-none mt-0 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="max-w-3xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="pointer-events-auto relative z-10 inline-flex items-center gap-1.5">
                      <TaskStatusIcon status={task.status} />
                      <FilterBadge className={taskStatusTone[task.status]} onSelect={() => setStatus(task.status)}>
                        {getTaskStatusLabel(task.status)}
                      </FilterBadge>
                    </span>
                    <FilterBadge className={priorityTone[task.priority]} onSelect={() => setPriority(task.priority)}>
                      {getPriorityLabel(task.priority)}
                    </FilterBadge>
                    <FilterBadge className="bg-muted text-muted-foreground" onSelect={() => setCategory(task.category)}>
                      {categoryLabels[task.category]}
                    </FilterBadge>
                    {task.blocked ? <Badge className="bg-danger/10 text-danger">Blocked</Badge> : null}
                  </div>
                  <h2 className="mt-4 text-lg font-semibold">{task.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{task.description}</p>
                  {task.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={task.imageUrl}
                      alt=""
                      className="mt-4 max-h-56 rounded-2xl border border-border object-cover"
                    />
                  ) : null}
                </div>
                <div className="flex flex-col gap-3 md:items-end">
                  <div className="pointer-events-auto relative z-10">
                    <TaskCardActions task={task} projects={projects} />
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
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
