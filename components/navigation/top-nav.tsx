"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Search } from "lucide-react";
import { navigationItems } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { ThemeToggle } from "@/components/navigation/theme-toggle";

export function TopNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-white/40 bg-background/75 backdrop-blur-2xl dark:border-white/5">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-soft">
              <LayoutGrid className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-tight">Command Center</p>
              <p className="text-xs text-muted-foreground">Offline-first workspace</p>
            </div>
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
