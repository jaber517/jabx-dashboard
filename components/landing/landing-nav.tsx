"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { fraunces } from "@/lib/fonts";
import { cn } from "@/lib/utils";

const links = [
  { href: "/about", label: "About" },
  { href: "/occ", label: "OCC" },
  { href: "/claude", label: "Claude" },
  { href: "/contact", label: "Contact me" }
];

const EXIT_DURATION = 160;

export function LandingNav() {
  const [mounted, setMounted] = useState(false);
  const [entered, setEntered] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>();

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
    <header className="relative flex items-center justify-between py-6">
      <Link href="/" className="flex items-center gap-3">
        <span className="relative h-11 w-11 overflow-hidden rounded-full ring-2 ring-[#211d16]/10">
          <Image src="/logo.jpg" alt="Jaber logo" fill className="object-cover" />
        </span>
        <span className={`${fraunces.className} text-2xl font-bold tracking-tight`}>
          Jaber
        </span>
      </Link>

      <nav className="flex items-center gap-3 sm:gap-6">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="hidden text-sm font-medium text-[#4c463d] transition ease-spring hover:text-[#211d16] sm:inline"
          >
            {link.label}
          </Link>
        ))}
        <Link
          href="/dashboard"
          className="rounded-full bg-[#f79a6b] px-5 py-2.5 text-sm font-semibold text-[#211d16] shadow-[0_2px_0_rgba(33,29,22,0.25)] transition ease-spring hover:bg-[#f58b54] active:scale-95 active:shadow-none motion-reduce:active:scale-100"
        >
          Dashboard
        </Link>
        <button
          type="button"
          onClick={() => (mounted ? closeMenu() : openMenu())}
          aria-label={mounted ? "Close menu" : "Open menu"}
          aria-expanded={mounted}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-[#211d16]/15 bg-white text-[#211d16] transition ease-spring hover:bg-[#f5ead9] active:scale-90 motion-reduce:active:scale-100 sm:hidden"
        >
          {mounted ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {mounted ? (
        <>
          {/* Invisible tap-outside target — every other overlay in the app
              dismisses on outside click; this menu should too. */}
          <button
            type="button"
            aria-hidden="true"
            tabIndex={-1}
            onClick={closeMenu}
            className="fixed inset-0 z-40 cursor-default sm:hidden"
          />
          <nav
            className={cn(
              "absolute inset-x-0 top-full z-50 rounded-3xl border border-[#211d16]/10 bg-white p-2 shadow-[0_20px_50px_-20px_rgba(33,29,22,0.35)] transition ease-spring motion-reduce:transition-opacity sm:hidden",
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
                className="block rounded-2xl px-5 py-3.5 text-base font-medium text-[#211d16] transition ease-spring hover:bg-[#faf4ec] active:scale-[0.98] motion-reduce:active:scale-100"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </>
      ) : null}
    </header>
  );
}
