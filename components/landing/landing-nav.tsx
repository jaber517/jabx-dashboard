import Image from "next/image";
import Link from "next/link";
import { fraunces } from "@/lib/fonts";

const links = [
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact me" }
];

export function LandingNav() {
  return (
    <header className="flex items-center justify-between py-6">
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
      </nav>
    </header>
  );
}
