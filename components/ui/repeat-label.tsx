import { Repeat as RepeatIcon } from "lucide-react";
import { asRepeat, repeatLabels, repeatShortLabels } from "@/lib/repeat";
import { cn } from "@/lib/utils";

// "↻ Weekly" beside a repeating task; nothing for one-off tasks.
export function RepeatLabel({ repeat, className }: { repeat: string; className?: string }) {
  const value = asRepeat(repeat);
  if (!value) return null;
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground", className)} title={repeatLabels[value]}>
      <RepeatIcon className="h-3.5 w-3.5" aria-hidden="true" />
      {repeatShortLabels[value]}
    </span>
  );
}
