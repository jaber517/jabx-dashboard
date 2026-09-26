"use client";

import Link from "next/link";
import { useDeferredValue, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Select } from "@/components/ui/select";
import { categoryDot, categoryLabels, priorityTone, statusTone } from "@/lib/constants";
import { formatDate, getPriorityLabel, getStatusLabel } from "@/lib/formatters";
import { cn } from "@/lib/utils";
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

  const q = deferredQuery.trim().toLowerCase();
  const filtered = projects.filter(
    (project) =>
      (!q || project.title.toLowerCase().includes(q) || project.summary.toLowerCase().includes(q)) &&
      (category === "ALL" || project.category === category) &&
      (status === "ALL" || project.status === status) &&
      (priority === "ALL" || project.priority === priority)
  );

  const sorted = [...filtered].sort((a, b) => {
    switch (sort) {
      case "TITLE":
        return a.title.localeCompare(b.title);
      case "DUE":
        return (a.dueDate ? Date.parse(a.dueDate) : Infinity) - (b.dueDate ? Date.parse(b.dueDate) : Infinity);
      case "PRIORITY":
        return TASK_PRIORITIES.indexOf(a.priority) - TASK_PRIORITIES.indexOf(b.priority);
      case "PROGRESS":
        return b.progress - a.progress;
      default:
        return Date.parse(b.updatedAt) - Date.parse(a.updatedAt);
    }
  });

  const chip = (active: boolean) =>
    cn(
      "flex h-9 items-center gap-2 rounded-full border px-3.5 text-[13px] font-semibold transition-colors",
      active ? "border-primary bg-muted text-foreground" : "border-border text-muted-foreground hover:text-foreground"
    );

  return (
    <div className="page-shell">
      <PageHeader eyebrow="Workspace" title="Projects" actions={<CreateProjectDialog />} />

      <div className="flex flex-col gap-3">
        <div role="group" aria-label="Category" className="flex flex-wrap gap-2">
          <button type="button" aria-pressed={category === "ALL"} onClick={() => setCategory("ALL")} className={chip(category === "ALL")}>
            All <span className="tabular-nums text-muted-foreground">{projects.length}</span>
          </button>
          {PROJECT_CATEGORIES.map((item) => (
            <button key={item} type="button" aria-pressed={category === item} onClick={() => setCategory(item)} className={chip(category === item)}>
              <span className={cn("h-2 w-2 rounded-full", categoryDot[item])} aria-hidden="true" />
              {categoryLabels[item]}
              <span className="tabular-nums text-muted-foreground">
                {projects.filter((project) => project.category === item).length}
              </span>
            </button>
          ))}
        </div>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search projects…" aria-label="Search projects" className="h-10" />
          <Select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Status" className="h-10">
            <option value="ALL">All statuses</option>
            {PROJECT_STATUSES.map((item) => (
              <option key={item} value={item}>{getStatusLabel(item)}</option>
            ))}
          </Select>
          <Select value={priority} onChange={(event) => setPriority(event.target.value)} aria-label="Priority" className="h-10">
            <option value="ALL">All priorities</option>
            {TASK_PRIORITIES.map((item) => (
              <option key={item} value={item}>{getPriorityLabel(item)}</option>
            ))}
          </Select>
          <Select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort" className="h-10">
            <option value="RECENT">Sort: Recently updated</option>
            <option value="DUE">Sort: Due date</option>
            <option value="PROGRESS">Sort: Progress</option>
            <option value="PRIORITY">Sort: Priority</option>
            <option value="TITLE">Sort: Title A–Z</option>
          </Select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No projects match" description="Widen the category, status or priority filters to see more." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sorted.map((project) => (
            <article
              key={project.id}
              className="group relative flex flex-col overflow-hidden rounded-3xl border border-border bg-surface transition-colors hover:border-primary"
            >
              {project.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={project.imageUrl} alt="" className="h-40 w-full border-b border-border object-cover" />
              ) : null}
              <div className="flex flex-1 flex-col gap-4 p-5">
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    <span className={cn("h-2 w-2 rounded-full", categoryDot[project.category])} aria-hidden="true" />
                    {categoryLabels[project.category]}
                  </span>
                  <div className="relative z-10">
                    <ProjectCardActions project={project} />
                  </div>
                </div>
                <div>
                  <h2 className="text-xl font-bold leading-tight tracking-[-0.02em]">
                    <Link href={`/projects/${project.id}`} className="after:absolute after:inset-0">
                      {project.title}
                    </Link>
                  </h2>
                  <p className="mt-1.5 line-clamp-2 text-sm leading-6 text-muted-foreground">{project.summary}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge className={statusTone[project.status]}>{getStatusLabel(project.status)}</Badge>
                  <Badge className={priorityTone[project.priority]}>{getPriorityLabel(project.priority)}</Badge>
                </div>
                <div className="mt-auto">
                  <div className="mb-2 flex justify-between text-[13px]">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-bold tabular-nums">{project.progress}%</span>
                  </div>
                  <ProgressBar value={project.progress} />
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-border pt-3 text-[13px] text-muted-foreground">
                  <span>{project.tasks?.length ?? 0} tasks</span>
                  <span>{project.milestones?.length ?? 0} milestones</span>
                  {project.dueDate ? <span className="ml-auto">Due {formatDate(project.dueDate, "d MMM yyyy")}</span> : null}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
