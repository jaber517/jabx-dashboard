import { ListChecks } from "lucide-react";
import { cn } from "@/lib/utils";

// "☑ 2/5" beside a task with a checklist; green once every step is done.
export function ChecklistProgress({ done, total, className }: { done: number; total: number; className?: string }) {
  if (total === 0) return null;
  const complete = done === total;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-semibold tabular-nums",
        complete ? "text-tone-green" : "text-muted-foreground",
        className
      )}
      title={`${done} of ${total} steps done`}
    >
      <ListChecks className="h-3.5 w-3.5" aria-hidden="true" />
      <span className="sr-only">Checklist: </span>
      {done}/{total}
    </span>
  );
}
