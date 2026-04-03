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

export function ProjectsView({ projects }: { projects: ProjectRecord[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [priority, setPriority] = useState("ALL");
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

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Portfolio"
        title="Projects"
        description="A structured view of active and upcoming work with filters for category, priority, and execution status."
        actions={
          <Link href="/" className={buttonVariants({ variant: "secondary", size: "lg" })}>
            Back to overview
          </Link>
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
            filteredProjects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="surface-panel-elevated rounded-3xl p-6 transition hover:-translate-y-0.5 hover:border-primary/30"
              >
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
