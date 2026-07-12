"use client";

import Link from "next/link";
import { useDeferredValue, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Select } from "@/components/ui/select";
import { categoryDescriptions, categoryLabels, priorityTone, statusTone } from "@/lib/constants";
import { formatDate, getPriorityLabel, getStatusLabel } from "@/lib/formatters";
import { PROJECT_CATEGORIES, PROJECT_STATUSES, TASK_PRIORITIES } from "@/types";
import type { ProjectRecord } from "@/types";
import { CreateProjectDialog } from "@/features/projects/create-project-dialog";
import { ProjectCardActions } from "@/features/projects/project-card-actions";

export function ProjectsView({ projects }: { projects: ProjectRecord[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [priority, setPriority] = useState("ALL");
  const [sort, setSort] = useState("RECENT");
  const deferredQuery = useDeferredValue(query);

  const filteredProjects = projects.filter((project) => {
    const matchesQuery =
      deferredQuery.length === 0 ||
      project.title.toLowerCase().includes(deferredQuery.toLowerCase()) ||
      project.summary.toLowerCase().includes(deferredQuery.toLowerCase());
    const matchesCategory = category === "ALL" || project.category === category;
    const matchesStatus = status === "ALL" || project.status === status;
    const matchesPriority = priority === "ALL" || project.priority === priority;

    return matchesQuery && matchesCategory && matchesStatus && matchesPriority;
  });

  const sortedProjects = [...filteredProjects].sort((a, b) => {
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
      case "PROGRESS":
        return b.progress - a.progress;
      default:
        return Date.parse(b.updatedAt) - Date.parse(a.updatedAt);
    }
  });

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Portfolio"
        title="Projects"
        description="A structured view of active and upcoming work with filters for category, priority, and execution status."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/dashboard" className={buttonVariants({ variant: "secondary", size: "lg" })}>
              Back to overview
            </Link>
            <CreateProjectDialog />
          </div>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Narrow the portfolio by workspace, status, and urgency.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search projects..." />
          <Select value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="ALL">All categories</option>
            {PROJECT_CATEGORIES.map((item) => (
              <option key={item} value={item}>
                {categoryLabels[item]}
              </option>
            ))}
          </Select>
          <Select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="ALL">All statuses</option>
            {PROJECT_STATUSES.map((item) => (
              <option key={item} value={item}>
                {getStatusLabel(item)}
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
          <Select value={sort} onChange={(event) => setSort(event.target.value)}>
            <option value="RECENT">Sort: Newest first</option>
            <option value="TITLE">Sort: Title A–Z</option>
            <option value="DUE">Sort: Due date</option>
            <option value="PRIORITY">Sort: Priority</option>
            <option value="PROGRESS">Sort: Progress</option>
          </Select>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="grid gap-4">
          {filteredProjects.length === 0 ? (
            <EmptyState
              title="No projects match these filters"
              description="Try widening the category, priority, or status filters to bring more items back into view."
            />
          ) : (
            sortedProjects.map((project) => (
              <div key={project.id} className="relative">
                <div className="absolute right-4 top-4 z-10">
                  <ProjectCardActions project={project} />
                </div>
              <Link
                href={`/projects/${project.id}`}
                className="block surface-panel-elevated overflow-hidden rounded-3xl p-6 transition hover:-translate-y-0.5 hover:border-primary/30"
              >
                {project.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={project.imageUrl}
                    alt=""
                    className="-mx-6 -mt-6 mb-5 h-44 w-[calc(100%+3rem)] max-w-none object-cover"
                  />
                ) : null}
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={statusTone[project.status]}>{getStatusLabel(project.status)}</Badge>
                  <Badge className={priorityTone[project.priority]}>{getPriorityLabel(project.priority)}</Badge>
                  <Badge className="bg-muted text-muted-foreground">
                    {categoryLabels[project.category]}
                  </Badge>
                </div>
                <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="max-w-2xl">
                    <h2 className="text-xl font-semibold">{project.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {project.summary}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-muted px-4 py-3 text-right">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      Progress
                    </p>
                    <p className="mt-1 text-2xl font-semibold">{project.progress}%</p>
                  </div>
                </div>
                <ProgressBar value={project.progress} className="mt-5" />
                <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  <span>{project.owner ?? "Unassigned owner"}</span>
                  <span>{project.tasks?.length ?? 0} tasks</span>
                  <span>{project.milestones?.length ?? 0} milestones</span>
                  {project.dueDate ? <span>Due {formatDate(project.dueDate)}</span> : null}
                </div>
              </Link>
              </div>
            ))
          )}
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Category overview</CardTitle>
            <CardDescription>
              A quick reminder of how each workspace is framed inside the dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {PROJECT_CATEGORIES.map((item) => (
              <div key={item} className="rounded-2xl border border-border bg-surface p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold">{categoryLabels[item]}</p>
                  <Badge className="bg-muted text-muted-foreground">
                    {projects.filter((project) => project.category === item).length} projects
                  </Badge>
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {categoryDescriptions[item]}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
