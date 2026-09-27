"use client";

import { useOptimistic, useTransition } from "react";
import Link from "next/link";
import { useUndo } from "@/components/providers/undo-provider";
import { RepeatLabel } from "@/components/ui/repeat-label";
import { setTaskDone, setTaskStatus } from "@/lib/actions";
import { cn } from "@/lib/utils";

// One row of Home's "Next up" list: tick the box to complete the task in place.
export function NextUpTask({
  id,
  title,
  meta,
  dot,
  due,
  overdue,
  priority,
  previousStatus,
  repeat = ""
}: {
  id: string;
  title: string;
  meta: string;
  dot: string;
  due?: string;
  overdue: boolean;
  priority: { label: string; tone: string };
  previousStatus: string;
  repeat?: string;
}) {
  const { notify } = useUndo();
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useOptimistic(false);

  return (
    <li className="flex min-h-14 items-center gap-3.5 border-b border-border px-5 py-2.5 last:border-b-0">
      {/* A 44px tap target around the 18px box. */}
      <label className="-m-3 flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center">
        <input
          type="checkbox"
          checked={done}
          disabled={pending}
          aria-label={`Mark "${title}" done`}
          onChange={() =>
            startTransition(async () => {
              setDone(true);
              await setTaskDone(id, true);
              notify(`Completed “${title}”`, () => startTransition(() => setTaskStatus(id, previousStatus)));
            })
          }
          className="h-[18px] w-[18px] shrink-0 cursor-pointer accent-[hsl(var(--primary-strong))]"
        />
      </label>
      <div className="min-w-0 flex-1">
        <Link
          href={`/tasks/${id}`}
          className={cn("block truncate text-[15px] font-semibold hover:text-primary", done && "text-muted-foreground line-through")}
        >
          {title}
        </Link>
        <p className="mt-0.5 flex items-center gap-1.5 truncate text-[13px] text-muted-foreground">
          <span className={cn("h-2 w-2 shrink-0 rounded-full", dot)} aria-hidden="true" />
          {meta}
          <RepeatLabel repeat={repeat} className="ml-1.5" />
        </p>
      </div>
      <span
        className={cn(
          "hidden shrink-0 items-center gap-1.5 rounded-full border border-border px-2.5 py-0.5 text-xs font-semibold before:h-1.5 before:w-1.5 before:rounded-full before:bg-current sm:inline-flex",
          priority.tone
        )}
      >
        {priority.label}
      </span>
      {due ? (
        <span className={cn("w-16 shrink-0 text-right text-[13px] font-semibold tabular-nums", overdue ? "text-danger" : "text-muted-foreground")}>
          {due}
        </span>
      ) : null}
    </li>
  );
}
