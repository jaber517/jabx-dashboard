"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { categoryLabels, categoryDot } from "@/lib/constants";
import { formatRelativeDate } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { PROJECT_CATEGORIES } from "@/types";
import type { ActivityRecord } from "@/types";

export function ActivityView({ activities }: { activities: ActivityRecord[] }) {
  const [category, setCategory] = useState("ALL");

  const filteredActivities = activities.filter(
    (activity) => category === "ALL" || activity.category === category
  );

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Timeline"
        title="Recent activity"
        description="A clean activity feed for recent changes, decisions, and project movement across the dashboard."
      />

      <Card>
        <CardHeader className="flex-row items-end justify-between gap-4">
          <div>
            <CardTitle>Activity feed</CardTitle>
            <CardDescription>
              Scan updates by category or review everything in one place.
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
          {filteredActivities.length === 0 ? (
            <EmptyState
              title="No activity yet"
              description="Recent edits, task changes, and project updates will appear here once the workspace starts moving."
            />
          ) : (
            filteredActivities.map((activity) => (
              <div key={activity.id} className="flex gap-4 rounded-3xl border border-border bg-surface p-5">
                <div className="flex flex-col items-center">
                  <span className={cn("h-3 w-3 rounded-full", categoryDot[activity.category])} />
                  <span className="mt-2 h-full w-px bg-border" />
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold">{activity.action}</p>
                    <Badge className="bg-muted text-muted-foreground">
                      {categoryLabels[activity.category]}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {activity.description}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
                    <span>{formatRelativeDate(activity.createdAt)}</span>
                    {activity.project ? <span>{activity.project.title}</span> : null}
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
