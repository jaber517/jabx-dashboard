"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

// 1:1-ish tracking toward the pointer, spring back on leave — a small,
// deliberate bit of "the interface reaches toward you" rather than a plain
// hover state.
export function MagneticButton({
  href,
  className,
  children
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const btn = ref.current;
    if (!btn) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let tx = 0,
      ty = 0,
      x = 0,
      y = 0,
      vx = 0,
      vy = 0,
      raf: number | null = null;
    const stiffness = 210;
    const dampingCoef = 22;

    function loop() {
      const fx = -stiffness * (x - tx) - dampingCoef * vx;
      const fy = -stiffness * (y - ty) - dampingCoef * vy;
      vx += fx * (1 / 60);
      vy += fy * (1 / 60);
      x += vx * (1 / 60);
      y += vy * (1 / 60);
      if (btn) btn.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px)`;
      if (Math.abs(x - tx) > 0.1 || Math.abs(vx) > 0.1 || Math.abs(y - ty) > 0.1 || Math.abs(vy) > 0.1) {
        raf = requestAnimationFrame(loop);
      } else {
        raf = null;
      }
    }

    function kick() {
      if (!raf) raf = requestAnimationFrame(loop);
    }

    function onMove(event: PointerEvent) {
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      tx = (event.clientX - (rect.left + rect.width / 2)) * 0.25;
      ty = (event.clientY - (rect.top + rect.height / 2)) * 0.25;
      kick();
    }

    function onLeave() {
      tx = 0;
      ty = 0;
      kick();
    }

    btn.addEventListener("pointermove", onMove);
    btn.addEventListener("pointerleave", onLeave);
    return () => {
      btn.removeEventListener("pointermove", onMove);
      btn.removeEventListener("pointerleave", onLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <Link
      ref={ref}
      href={href}
      style={{ willChange: "transform" }}
      className={cn(
        "relative inline-flex items-center justify-center rounded-lg bg-[#0A84FF] px-4 py-2 text-[13px] font-medium tracking-[0.03em] text-[#04101F] transition-colors active:scale-[0.96] motion-reduce:active:scale-100",
        className
      )}
    >
      {children}
    </Link>
  );
}
