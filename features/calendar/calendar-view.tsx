"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { categoryLabels, statusTone } from "@/lib/constants";
import { formatDate, formatRelativeDate, getStatusLabel } from "@/lib/formatters";
import { PROJECT_CATEGORIES } from "@/types";
import type { MilestoneRecord } from "@/types";

export function CalendarView({ milestones }: { milestones: MilestoneRecord[] }) {
  const [category, setCategory] = useState("ALL");

  const filteredMilestones = milestones.filter(
    (milestone) => category === "ALL" || milestone.category === category
  );

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Calendar"
        title="Deadlines and milestones"
        description="A structured deadline view for near-term delivery checkpoints and execution windows."
      />

      <Card>
        <CardHeader className="flex-row items-end justify-between gap-4">
          <div>
            <CardTitle>Upcoming calendar</CardTitle>
            <CardDescription>
              Filter milestones by category and focus on the next delivery window.
            </CardDescription>
          </div>
          <Select value={category} onChange={(event) => setCategory(event.target.value)} className="min-w-[220px]">
            <option value="ALL">All categories</option>
            {PROJECT_CATEGORIES.map((item) => (
              <option key={item} value={item}>
                {categoryLabels[item]}
              </option>
            ))}
          </Select>
        </CardHeader>
        <CardContent className="space-y-4">
          {filteredMilestones.length === 0 ? (
            <EmptyState
              title="No milestones in this view"
              description="Switch the category filter to reveal upcoming project checkpoints."
            />
          ) : (
            filteredMilestones.map((milestone) => (
              <div key={milestone.id} className="rounded-3xl border border-border bg-surface p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={statusTone[milestone.status]}>{getStatusLabel(milestone.status)}</Badge>
                      <Badge className="bg-muted text-muted-foreground">
                        {categoryLabels[milestone.category]}
                      </Badge>
                    </div>
                    <h3 className="mt-4 text-lg font-semibold">{milestone.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {milestone.summary}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
                      <span>{milestone.project?.title ?? "Standalone milestone"}</span>
                      <span>{formatRelativeDate(milestone.date)}</span>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-border bg-background px-4 py-3 text-right">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Date</p>
                    <p className="mt-1 text-base font-semibold">{formatDate(milestone.date)}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
