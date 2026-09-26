"use client";

import { cn } from "@/lib/utils";

// A badge that filters the current list when clicked. Rendered as a span with a
// button role so it stays valid markup even when it sits inside a card-wide
// <a> link; the handler stops the click from also triggering that link.
export function FilterBadge({
  className,
  onSelect,
  children,
  title
}: {
  className?: string;
  onSelect: () => void;
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <span
      role="button"
      tabIndex={0}
      title={title ?? "Filter by this"}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onSelect();
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          event.stopPropagation();
          onSelect();
        }
      }}
      className={cn(
        "pointer-events-auto relative z-10 inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-border px-2.5 py-0.5 text-xs font-semibold text-muted-foreground transition ease-spring before:h-1.5 before:w-1.5 before:shrink-0 before:rounded-full before:bg-current hover:border-primary active:scale-90 motion-reduce:active:scale-100",
        className
      )}
    >
      {children}
    </span>
  );
}
