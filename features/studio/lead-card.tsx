"use client";

import { AlertTriangle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatRelativeDate } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { LeadWithStage } from "./types";

export function LeadCard({
  lead,
  selected,
  onSelect
}: {
  lead: LeadWithStage;
  selected?: boolean;
  onSelect: (lead: LeadWithStage) => void;
}) {
  const isFailed = lead.email_status === "failed";

  return (
    <button
      type="button"
      onClick={() => onSelect(lead)}
      aria-label={`Lead details for ${lead.name} at ${lead.company}`}
      className={cn(
        "group relative flex w-full flex-col gap-2.5 rounded-2xl border bg-surface p-3.5 text-left transition-colors hover:border-primary",
        selected ? "border-primary ring-1 ring-primary" : "border-border"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h4 className="truncate text-sm font-bold text-foreground group-hover:text-primary">
            {lead.name}
          </h4>
          <p className="truncate text-xs font-medium text-muted-foreground">
            {lead.company}
          </p>
        </div>
        {isFailed ? (
          <span
            title="Email confirmation failed"
            className="flex shrink-0 items-center gap-1 rounded-full border border-danger/40 bg-danger/10 px-2 py-0.5 text-[11px] font-semibold text-danger"
          >
            <AlertTriangle className="h-3 w-3" aria-hidden="true" />
            Failed
          </span>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        <Badge className="text-muted-foreground">{lead.sector}</Badge>
        <span className="rounded-md bg-muted px-2 py-0.5 font-medium text-foreground">
          {lead.package}
        </span>
      </div>

      {lead.note ? (
        <p className="line-clamp-2 rounded-lg bg-muted/50 px-2 py-1 text-xs text-muted-foreground">
          {lead.note}
        </p>
      ) : null}

      <div className="mt-1 flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
        <span className="truncate">{lead.timing}</span>
        <span className="flex shrink-0 items-center gap-1">
          <Clock className="h-3 w-3" aria-hidden="true" />
          {formatRelativeDate(lead.submitted_at)}
        </span>
      </div>
    </button>
  );
}
