import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// An outlined label with a small dot in the label's own colour. Callers pass a
// text-* tone (see lib/constants.ts); the word always names the state, so the
// colour is never the only signal.
export function Badge({
  children,
  className,
  dot = true
}: {
  children: ReactNode;
  className?: string;
  dot?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-0.5 text-xs font-semibold text-muted-foreground",
        dot && "before:h-1.5 before:w-1.5 before:shrink-0 before:rounded-full before:bg-current",
        className
      )}
    >
      {children}
    </span>
  );
}
