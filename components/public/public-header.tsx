"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Wordmark } from "./public-art";
import "./public.css";

const links = [{ href: "/projects", label: "Projects" }, { href: "/about", label: "About" }, { href: "/team", label: "Team" }];

export function PublicHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  return <header className="public-header" onKeyDown={(event) => {
    if (event.key === "Escape" && open) { setOpen(false); toggle.current?.focus(); }
  }} onBlur={(event) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false);
  }}>
    <div className="public-container public-header-row">
      <Link href="/" aria-label="jabx — Home" className="public-logo" onClick={() => setOpen(false)}>
        <Wordmark priority />
      </Link>
      <nav aria-label="Main navigation" className="public-nav">
        {links.map(({ href, label }) => <Link key={href} href={href} className="public-desktop-link" aria-current={pathname === href ? "page" : undefined}>{label}</Link>)}
        <Link href="/contact" className="public-button" aria-current={pathname === "/contact" ? "page" : undefined} onClick={() => setOpen(false)}>Contact</Link>
        <button ref={toggle} type="button" className="public-menu-toggle" aria-expanded={open} aria-controls="public-mobile-nav" aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen(!open)}>
          {open ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
        </button>
      </nav>
    </div>
    <nav id="public-mobile-nav" aria-label="Mobile navigation" className="public-mobile-nav" hidden={!open}>
      {links.map(({ href, label }) => <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined} onClick={() => setOpen(false)}>{label}</Link>)}
    </nav>
  </header>;
}
