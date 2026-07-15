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
        "pointer-events-auto relative z-10 inline-flex cursor-pointer items-center rounded-full px-3 py-1 text-xs font-medium transition hover:ring-2 hover:ring-primary/40",
        className
      )}
    >
      {children}
    </span>
  );
}
