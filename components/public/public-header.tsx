"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { plexMono } from "@/lib/fonts";
import { cn } from "@/lib/utils";
import { MagneticButton } from "@/components/public/magnetic-button";

const links = [
  { href: "/about", label: "About" },
  { href: "/occ", label: "OCC" },
  { href: "/claude", label: "Claude" },
  { href: "/contact", label: "Contact" }
];

const EXIT_DURATION = 160;

export function PublicHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [entered, setEntered] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 6);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function openMenu() {
    window.clearTimeout(closeTimer.current);
    setMounted(true);
  }

  function closeMenu() {
    setEntered(false);
    closeTimer.current = setTimeout(() => setMounted(false), EXIT_DURATION);
  }

  useEffect(() => {
    if (!mounted) return;
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") closeMenu();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mounted]);

  useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  return (
    <header
      className={cn(
        "sticky top-0 z-20 border-b border-transparent backdrop-blur-xl backdrop-saturate-150 transition-colors duration-250",
        scrolled ? "border-white/[0.08] bg-[#06080D]/75" : "bg-[#06080D]/35"
      )}
    >
      <div className="relative mx-auto flex h-14 max-w-[1080px] items-center justify-between px-6">
        <Link href="/" className={`${plexMono.className} flex items-center gap-2.5 text-[15px] text-[#EDF1F8]`}>
          <span className="flex h-[22px] w-[22px] items-center justify-center rounded-[6px] border border-white/[0.08] bg-white/[0.03] text-[11px] text-[#0A84FF]">
            J
          </span>
          <span>jabx</span>
        </Link>

        <nav className="flex items-center gap-7">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="hidden text-sm text-[#8A94A6] transition-colors ease-spring hover:text-[#EDF1F8] sm:inline"
            >
              {link.label}
            </Link>
          ))}
          <MagneticButton href="/dashboard" className="hidden sm:inline-flex">
            dashboard
          </MagneticButton>
          <button
            type="button"
            onClick={() => (mounted ? closeMenu() : openMenu())}
            aria-label={mounted ? "Close menu" : "Open menu"}
            aria-expanded={mounted}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-[#EDF1F8] transition ease-spring hover:bg-white/[0.06] active:scale-90 motion-reduce:active:scale-100 sm:hidden"
          >
            {mounted ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </nav>

        {mounted ? (
          <>
            <button
              type="button"
              aria-hidden="true"
              tabIndex={-1}
              onClick={closeMenu}
              className="fixed inset-0 z-40 cursor-default sm:hidden"
            />
            <nav
              className={cn(
                "absolute inset-x-0 top-full z-50 mx-4 rounded-xl border border-white/[0.08] bg-[#12161F] p-2 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.65)] transition ease-spring motion-reduce:transition-opacity sm:hidden",
                entered
                  ? "translate-y-0 scale-100 opacity-100 duration-200"
                  : "-translate-y-2 scale-95 opacity-0 duration-150"
              )}
              style={{ transformOrigin: "top" }}
            >
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={closeMenu}
                  className="block rounded-lg px-4 py-3 text-base text-[#EDF1F8] transition ease-spring hover:bg-white/[0.05] active:scale-[0.98] motion-reduce:active:scale-100"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/dashboard"
                onClick={closeMenu}
                className={`${plexMono.className} mt-1 block rounded-lg bg-[#0A84FF] px-4 py-3 text-center text-[13px] tracking-[0.03em] text-[#04101F] transition ease-spring active:scale-[0.98] motion-reduce:active:scale-100`}
              >
                dashboard
              </Link>
            </nav>
          </>
        ) : null}
      </div>
    </header>
  );
}
