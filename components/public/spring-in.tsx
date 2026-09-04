"use client";

import { useEffect, useRef, type ReactNode } from "react";

// A real critically-damped spring (not a CSS keyframe guess) driving an
// entrance transform — maps Apple's damping/response pair to a physical
// stiffness/damping stepper. response 0.42s, damping 1.0 is the "move /
// reposition" preset from the apple-design skill.
export function SpringIn({
  children,
  delay = 0,
  className
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      el.style.opacity = "1";
      el.style.transform = "none";
      return;
    }

    const response = 0.42;
    const damping = 1;
    const stiffness = Math.pow((2 * Math.PI) / response, 2);
    const dampingCoef = 2 * damping * Math.sqrt(stiffness);

    let y = 14;
    let v = 0;
    let o = 0;
    let last: number | null = null;
    let raf = 0;

    function frame(now: number) {
      if (last === null) last = now;
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;
      const force = -stiffness * y - dampingCoef * v;
      v += force * dt;
      y += v * dt;
      o += (1 - o) * Math.min(dt * 6, 1);
      if (el) {
        el.style.transform = `translateY(${y.toFixed(2)}px)`;
        el.style.opacity = o.toFixed(3);
      }
      if (Math.abs(y) > 0.25 || Math.abs(v) > 0.25) {
        raf = requestAnimationFrame(frame);
      } else if (el) {
        el.style.transform = "translateY(0)";
        el.style.opacity = "1";
      }
    }

    const timer = setTimeout(() => {
      raf = requestAnimationFrame(frame);
    }, delay);

    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [delay]);

  return (
    <div ref={ref} style={{ opacity: 0 }} className={className}>
      {children}
    </div>
  );
}
