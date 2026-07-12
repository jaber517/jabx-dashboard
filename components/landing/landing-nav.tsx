"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { fraunces } from "@/lib/fonts";

const links = [
  { href: "/about", label: "About" },
  { href: "/occ", label: "OCC" },
  { href: "/claude", label: "Claude" },
  { href: "/contact", label: "Contact me" }
];

export function LandingNav() {
  const [open, setOpen] = useState(false);

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
            className="hidden text-sm font-medium text-[#4c463d] transition hover:text-[#211d16] sm:inline"
          >
            {link.label}
          </Link>
        ))}
        <Link
          href="/dashboard"
          className="rounded-full bg-[#f79a6b] px-5 py-2.5 text-sm font-semibold text-[#211d16] shadow-[0_2px_0_rgba(33,29,22,0.25)] transition hover:bg-[#f58b54]"
        >
          Dashboard
        </Link>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-[#211d16]/15 bg-white text-[#211d16] transition hover:bg-[#f5ead9] sm:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {open ? (
        <nav className="absolute inset-x-0 top-full z-50 rounded-3xl border border-[#211d16]/10 bg-white p-2 shadow-[0_20px_50px_-20px_rgba(33,29,22,0.35)] sm:hidden">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="block rounded-2xl px-5 py-3.5 text-base font-medium text-[#211d16] transition hover:bg-[#faf4ec]"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      ) : null}
    </header>
  );
}
