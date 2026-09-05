"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { navigationItems } from "@/lib/constants";
import { plexMono } from "@/lib/fonts";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { GlobalSearch } from "@/components/navigation/global-search";
import { logout } from "@/lib/auth-actions";

export function TopNav() {
  const pathname = usePathname();

  const publicRoutes = ["/", "/about", "/contact", "/login", "/occ", "/claude", "/ai-news"];

  if (publicRoutes.includes(pathname)) {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/75 backdrop-blur-2xl">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-3 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5" aria-label="jabx.me">
            <Image src="/jabx-logo-header.jpg" alt="" width={80} height={80} priority className="h-8 w-8 rounded-lg" />
            <p className={`${plexMono.className} text-sm text-foreground`}>dashboard</p>
          </Link>

          <div className="flex items-center gap-2">
            <GlobalSearch />
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
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "border-b-2 px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
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
