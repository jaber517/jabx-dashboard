"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BarChart3,
  CalendarCheck,
  CalendarDays,
  Ellipsis,
  FileText,
  FolderKanban,
  House,
  Link2,
  LogOut,
  Newspaper,
  Plus,
  Search,
  SlidersHorizontal,
  SquareCheckBig,
  X,
  type LucideIcon
} from "lucide-react";
import { Wordmark } from "@/components/brand/wordmark";
import { openCreate } from "@/components/navigation/global-create";
import { GlobalSearch, openSearch } from "@/components/navigation/global-search";
import { allNavItems, navigationGroups, settingsNavItem, type NavIcon, type NavItem } from "@/lib/constants";
import { logout } from "@/lib/auth-actions";
import { cn } from "@/lib/utils";

const icons: Record<NavIcon, LucideIcon> = {
  home: House,
  projects: FolderKanban,
  tasks: SquareCheckBig,
  notes: FileText,
  calendar: CalendarDays,
  review: CalendarCheck,
  analytics: BarChart3,
  activity: Activity,
  news: Newspaper,
  resources: Link2,
  settings: SlidersHorizontal
};

const publicSite = process.env.NEXT_PUBLIC_PUBLIC_SITE_URL || "https://jabx.me";
const tabItems: NavItem[] = navigationGroups[0].items.slice(0, 4);
const moreItems = allNavItems.filter((item) => !tabItems.some((tab) => tab.href === item.href));

function useIsActive() {
  const pathname = usePathname();
  return (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`) || (href === "/dashboard" && pathname === "/");
}

function LogoutButton({ className }: { className?: string }) {
  return (
    <form action={logout}>
      <button type="submit" className={className}>
        <LogOut className="h-[18px] w-[18px]" aria-hidden="true" />
        Log out
      </button>
    </form>
  );
}

export type NavCounts = { openTasks: number; overdueTasks: number };

// Open-task count beside Tasks, with overdue ones called out in red.
function TaskCount({ counts }: { counts?: NavCounts }) {
  if (!counts || counts.openTasks === 0) return null;
  return (
    <span className="ml-auto flex items-center gap-1.5 text-xs font-semibold tabular-nums">
      {counts.overdueTasks > 0 ? (
        <span className="rounded-full border border-danger/40 px-1.5 text-danger" title={`${counts.overdueTasks} overdue`}>
          {counts.overdueTasks} late
        </span>
      ) : null}
      <span className="text-muted-foreground">{counts.openTasks}</span>
    </span>
  );
}

const navItemClass =
  "flex h-10 items-center gap-3 rounded-xl px-2.5 text-sm font-medium transition-colors";

// Desktop: a fixed left sidebar with grouped navigation, search and account links.
export function Sidebar({ counts }: { counts?: NavCounts }) {
  const isActive = useIsActive();
  const SettingsIcon = icons[settingsNavItem.icon];

  return (
    <aside className="sticky top-0 hidden h-screen w-[248px] shrink-0 flex-col gap-5 overflow-y-auto border-r border-border bg-surface px-4 pb-5 pt-6 lg:flex">
      <Link href="/dashboard" className="flex items-baseline gap-2.5 px-2" aria-label="Dashboard home">
        <Wordmark className="h-7 w-auto text-foreground" />
        <span className="text-[13px] font-semibold text-muted-foreground">dashboard</span>
      </Link>

      <GlobalSearch />

      <nav aria-label="Dashboard" className="flex flex-1 flex-col gap-5">
        {navigationGroups.map((group) => (
          <div key={group.label} className="flex flex-col gap-0.5">
            <p className="mb-1.5 px-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {group.label}
            </p>
            {group.items.map((item) => {
              const Icon = icons[item.icon];
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    navItemClass,
                    active ? "bg-muted font-semibold text-primary" : "text-foreground hover:bg-muted/60"
                  )}
                >
                  <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                  {item.label}
                  {item.href === "/tasks" ? <TaskCount counts={counts} /> : null}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="flex flex-col gap-0.5 border-t border-border pt-3.5">
        <Link
          href={settingsNavItem.href}
          aria-current={isActive(settingsNavItem.href) ? "page" : undefined}
          className={cn(
            navItemClass,
            isActive(settingsNavItem.href) ? "bg-muted font-semibold text-primary" : "text-foreground hover:bg-muted/60"
          )}
        >
          <SettingsIcon className="h-[18px] w-[18px]" aria-hidden="true" />
          {settingsNavItem.label}
        </Link>
        <LogoutButton className={cn(navItemClass, "w-full text-foreground hover:bg-muted/60")} />
        <a href={publicSite} className="flex h-9 items-center px-2.5 text-[13px] font-semibold text-muted-foreground hover:text-foreground">
          jabx.me ↗
        </a>
      </div>
    </aside>
  );
}

// Phones and tablets: a slim top bar, a bottom tab bar with the four main
// sections, and a More sheet for everything else.
export function MobileNavigation() {
  const isActive = useIsActive();
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreButton = useRef<HTMLButtonElement>(null);
  const moreActive = moreItems.some((item) => isActive(item.href));

  useEffect(() => setMoreOpen(false), [pathname]);

  useEffect(() => {
    if (!moreOpen) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMoreOpen(false);
        moreButton.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [moreOpen]);

  return (
    <>
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-background px-4 lg:hidden">
        <Link href="/dashboard" aria-label="Dashboard home">
          <Wordmark className="h-6 w-auto text-foreground" />
        </Link>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={openSearch}
            aria-label="Search"
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border text-foreground"
          >
            <Search className="h-[18px] w-[18px]" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => openCreate("task")}
            aria-label="New task"
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-strong text-primary-foreground"
          >
            <Plus className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </header>

      <nav
        aria-label="Dashboard"
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        {tabItems.map((item) => {
          const Icon = icons[item.icon];
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className="h-[22px] w-[22px]" aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
        <button
          ref={moreButton}
          type="button"
          aria-expanded={moreOpen}
          aria-controls="more-sheet"
          onClick={() => setMoreOpen((open) => !open)}
          className={cn(
            "flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold",
            moreOpen || moreActive ? "text-primary" : "text-muted-foreground"
          )}
        >
          <Ellipsis className="h-[22px] w-[22px]" aria-hidden="true" />
          More
        </button>
      </nav>

      {moreOpen ? (
        <div className="fixed inset-0 z-50 flex items-end bg-[#07111B]/70 lg:hidden" onClick={() => setMoreOpen(false)}>
          <div
            id="more-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="More"
            className="w-full rounded-t-3xl border-t border-border bg-surface px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-2 flex items-center justify-between px-1">
              <p className="text-sm font-bold">More</p>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                aria-label="Close"
                className="flex h-11 w-11 items-center justify-center rounded-2xl text-muted-foreground"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {moreItems.map((item) => {
                const Icon = icons[item.icon];
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex h-12 items-center gap-3 rounded-2xl border border-border px-3 text-sm font-semibold",
                      active ? "text-primary" : "text-foreground"
                    )}
                  >
                    <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-border pt-2">
              <LogoutButton className="flex h-11 items-center gap-3 px-1 text-sm font-semibold text-foreground" />
              <a href={publicSite} className="flex h-11 items-center px-1 text-[13px] font-semibold text-muted-foreground">
                jabx.me ↗
              </a>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
