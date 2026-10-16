"use client";

import { createElement, useEffect, useRef, type CSSProperties, type HTMLAttributes } from "react";

type RevealProps = HTMLAttributes<HTMLElement> & {
  as?: "div" | "section" | "article" | "figure";
  delay?: number;
};

/** Visible HTML first; progressively enhance only content below the viewport. */
export function Reveal({ as = "div", delay = 0, className = "", style, ...props }: RevealProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || !("IntersectionObserver" in window)) return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (preference.matches) return;

    // Never hide content already read, focused, or visible before hydration.
    if (element.getBoundingClientRect().top < window.innerHeight || element.contains(document.activeElement)) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting && entry.intersectionRatio >= 0.1)) show();
    }, { threshold: 0.1, rootMargin: "0px 0px -10% 0px" });

    function show() {
      element?.removeAttribute("data-reveal-pending");
      observer.disconnect();
    }

    observer.observe(element);
    element.setAttribute("data-reveal-pending", "");
    element.addEventListener("focusin", show);
    preference.addEventListener("change", show);
    return () => {
      show();
      element.removeEventListener("focusin", show);
      preference.removeEventListener("change", show);
    };
  }, []);

  return createElement(as, {
    ...props,
    ref,
    className: `public-reveal ${className}`.trim(),
    style: { ...style, "--reveal-delay": `${Math.min(Math.max(delay, 0), 300)}ms` } as CSSProperties,
  });
}
