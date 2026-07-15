"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { categoryLabels, categoryDot } from "@/lib/constants";
import { formatRelativeDate } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { FeedItem } from "@/lib/data";

const typeTone: Record<string, string> = {
  Project: "bg-primary/10 text-primary",
  Task: "bg-blue-500/10 text-blue-600 dark:text-blue-300",
  Note: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
  Resource: "bg-amber-500/10 text-amber-600 dark:text-amber-300"
};

export function ActivityView({ activities }: { activities: FeedItem[] }) {
  const [type, setType] = useState("ALL");

  const filtered = activities.filter((item) => type === "ALL" || item.type === type);

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Timeline"
        title="Recent activity"
        description="A live feed of the latest changes across your projects, tasks, notes, and resources."
      />

      <Card>
        <CardHeader className="flex-row items-end justify-between gap-4">
          <div>
            <CardTitle>Activity feed</CardTitle>
            <CardDescription>Newest changes first. Click an item to open it.</CardDescription>
          </div>
          <Select value={type} onChange={(event) => setType(event.target.value)} className="min-w-[200px]">
            <option value="ALL">Everything</option>
            <option value="Project">Projects</option>
            <option value="Task">Tasks</option>
            <option value="Note">Notes</option>
            <option value="Resource">Resources</option>
          </Select>
        </CardHeader>
        <CardContent className="space-y-4">
          {filtered.length === 0 ? (
            <EmptyState
              title="No activity yet"
              description="As you add and update projects, tasks, and notes, the latest changes will show up here."
            />
          ) : (
            filtered.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                target={item.type === "Resource" ? "_blank" : undefined}
                rel={item.type === "Resource" ? "noopener noreferrer" : undefined}
                className="flex gap-4 rounded-3xl border border-border bg-surface p-5 transition hover:border-primary/30"
              >
                <div className="flex flex-col items-center">
                  <span className={cn("h-3 w-3 rounded-full", categoryDot[item.category])} />
                  <span className="mt-2 h-full w-px bg-border" />
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold">{item.action}</p>
                    <Badge className={typeTone[item.type]}>{item.type}</Badge>
                    <Badge className="bg-muted text-muted-foreground">
                      {categoryLabels[item.category]}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm font-medium">{item.title}</p>
                  <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted-foreground">
                    {item.description}
                  </p>
                  <p className="mt-3 text-xs text-muted-foreground">{formatRelativeDate(item.at)}</p>
                </div>
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
