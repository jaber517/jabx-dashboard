"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Search } from "lucide-react";
import { navigationItems } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { ThemeToggle } from "@/components/navigation/theme-toggle";
import { logout } from "@/lib/auth-actions";

export function TopNav() {
  const pathname = usePathname();

  if (
    pathname === "/" ||
    pathname === "/about" ||
    pathname === "/contact" ||
    pathname === "/login"
  ) {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/40 bg-background/75 backdrop-blur-2xl dark:border-white/5">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3">
            <span className="relative h-11 w-11 overflow-hidden rounded-full bg-white shadow-soft ring-2 ring-foreground/10">
              <Image src="/logo.jpg" alt="Jaber logo" fill className="object-cover" />
            </span>
            <p className="text-sm font-semibold tracking-tight">Jaber&apos;s Dashboard</p>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/notes"
              className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "gap-2")}
            >
              <Search className="h-4 w-4" />
              <span className="hidden sm:inline">Search</span>
            </Link>
            <ThemeToggle />
            <form action={logout}>
              <button
                type="submit"
                title="Log out"
                aria-label="Log out"
                className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "gap-2")}
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Log out</span>
              </button>
            </form>
          </div>
        </div>

        <nav className="-mx-1 overflow-x-auto">
          <div className="flex min-w-max items-center gap-1 px-1">
            {navigationItems.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === item.href
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-medium transition",
                    active
                      ? "bg-primary text-primary-foreground shadow-soft"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </header>
  );
}
