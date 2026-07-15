"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarClock, FolderKanban, ListTodo } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { categoryLabels } from "@/lib/constants";
import { formatDate } from "@/lib/formatters";
import type { CalendarItem } from "@/lib/data";

const DAY = 1000 * 60 * 60 * 24;

function bucketFor(dueDate: string): string {
  const now = Date.now();
  const due = Date.parse(dueDate);
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  if (due < startOfToday.getTime()) return "Overdue";
  if (due <= now + 7 * DAY) return "This week";
  if (due <= now + 30 * DAY) return "Next 30 days";
  return "Later";
}

const BUCKET_ORDER = ["Overdue", "This week", "Next 30 days", "Later"];
const bucketTone: Record<string, string> = {
  Overdue: "bg-danger/10 text-danger",
  "This week": "bg-primary/10 text-primary",
  "Next 30 days": "bg-blue-500/10 text-blue-600 dark:text-blue-300",
  Later: "bg-muted text-muted-foreground"
};

export function CalendarView({ items }: { items: CalendarItem[] }) {
  const [type, setType] = useState("ALL");

  const filtered = items.filter((item) => type === "ALL" || item.type === type);

  const grouped = BUCKET_ORDER.map((bucket) => ({
    bucket,
    items: filtered.filter((item) => bucketFor(item.dueDate) === bucket)
  })).filter((group) => group.items.length > 0);

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Calendar"
        title="Deadlines"
        description="Everything with a due date — projects and tasks — grouped by how soon it's due."
      />

      <Card>
        <CardHeader className="flex-row items-end justify-between gap-4">
          <div>
            <CardTitle>Upcoming schedule</CardTitle>
            <CardDescription>Click any item to open it.</CardDescription>
          </div>
          <Select value={type} onChange={(event) => setType(event.target.value)} className="min-w-[200px]">
            <option value="ALL">Projects &amp; tasks</option>
            <option value="Project">Projects only</option>
            <option value="Task">Tasks only</option>
          </Select>
        </CardHeader>
        <CardContent className="space-y-8">
          {grouped.length === 0 ? (
            <EmptyState
              title="Nothing scheduled"
              description="Add a due date to a project or task and it will appear here."
            />
          ) : (
            grouped.map((group) => (
              <div key={group.bucket}>
                <div className="mb-3 flex items-center gap-3">
                  <Badge className={bucketTone[group.bucket]}>{group.bucket}</Badge>
                  <span className="text-xs text-muted-foreground">{group.items.length} item{group.items.length === 1 ? "" : "s"}</span>
                </div>
                <div className="space-y-3">
                  {group.items.map((item) => (
                    <Link
                      key={item.id}
                      href={item.href}
                      className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-4 transition hover:border-primary/30"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                        {item.type === "Project" ? (
                          <FolderKanban className="h-5 w-5" />
                        ) : (
                          <ListTodo className="h-5 w-5" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-semibold">{item.title}</p>
                          <Badge className="bg-muted text-muted-foreground">
                            {categoryLabels[item.category]}
                          </Badge>
                        </div>
                        <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{item.description}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5 text-sm font-medium">
                        <CalendarClock className="h-4 w-4 text-muted-foreground" />
                        {formatDate(item.dueDate)}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
