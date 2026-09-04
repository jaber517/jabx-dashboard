"use client";

import Link from "next/link";
import type { PointerEvent, ReactNode } from "react";
import { cn } from "@/lib/utils";

// The glow follows the pointer on the causal frame (pointermove), not after
// — via a CSS custom property read by a ::before radial-gradient, so no
// re-render is needed per frame.
function onSpotlightMove(event: PointerEvent<HTMLElement>) {
  const rect = event.currentTarget.getBoundingClientRect();
  event.currentTarget.style.setProperty("--x", `${event.clientX - rect.left}px`);
  event.currentTarget.style.setProperty("--y", `${event.clientY - rect.top}px`);
}

const glowClass = {
  signal:
    "before:bg-[radial-gradient(220px_circle_at_var(--x,50%)_var(--y,50%),rgba(10,132,255,0.14),transparent_65%)]",
  amber:
    "before:bg-[radial-gradient(180px_circle_at_var(--x,50%)_var(--y,50%),rgba(245,166,35,0.08),transparent_65%)]"
};

const baseClass =
  "group relative flex flex-col gap-2.5 overflow-hidden transition ease-spring before:pointer-events-none before:absolute before:inset-0 before:opacity-0 before:transition-opacity before:duration-200 hover:before:opacity-100";

export function SpotlightCard({
  href,
  dashed,
  glow = "signal",
  className,
  children
}: {
  href?: string;
  dashed?: boolean;
  glow?: "signal" | "amber";
  className?: string;
  children: ReactNode;
}) {
  const classes = cn(
    baseClass,
    glowClass[glow],
    dashed
      ? "rounded-[10px] border border-dashed border-white/[0.08] bg-transparent p-[18px] active:scale-[0.99]"
      : "bg-[#12161F] p-6 active:scale-[0.99]",
    "motion-reduce:active:scale-100",
    className
  );

  if (href) {
    return (
      <Link href={href} className={classes} onPointerMove={onSpotlightMove}>
        {children}
      </Link>
    );
  }

  return (
    <div className={classes} onPointerMove={onSpotlightMove}>
      {children}
    </div>
  );
}
