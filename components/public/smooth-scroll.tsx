"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";

/** Mounted by PublicShell only. Touch, keyboard, and anchors stay native. */
export function SmoothScroll() {
  const pathname = usePathname();

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let lenis: Lenis | undefined;

    function syncPreference() {
      lenis?.destroy();
      lenis = undefined;
      if (!preference.matches) {
        lenis = new Lenis({
          autoRaf: true,
          lerp: 0.12,
          smoothWheel: true,
          syncTouch: false,
          anchors: false,
          stopInertiaOnNavigate: true,
        });
      }
    }

    // End any wheel inertia before the browser follows an anchor. Let the
    // browser retain hash history, target focus, and modified-click behavior.
    function onAnchor(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!(link instanceof HTMLAnchorElement)) return;
      const target = new URL(link.href);
      if (target.origin === location.origin && target.pathname === location.pathname && target.search === location.search && target.hash) {
        lenis?.scrollTo(window.scrollY, { immediate: true });
      }
    }

    syncPreference();
    preference.addEventListener("change", syncPreference);
    document.addEventListener("click", onAnchor);
    return () => {
      preference.removeEventListener("change", syncPreference);
      document.removeEventListener("click", onAnchor);
      lenis?.destroy();
    };
  }, [pathname]);

  return null;
}
