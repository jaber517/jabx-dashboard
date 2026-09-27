"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { ArrowRight, ExternalLink, Plus, Search } from "lucide-react";
import { openCreate, type CreateKind } from "@/components/navigation/global-create";
import { cn } from "@/lib/utils";
import { allNavItems, recordTypeTone } from "@/lib/constants";

const EXIT_DURATION = 160;

type PaletteAction = { id: string; group: "Create" | "Go to"; label: string; keywords: string; create?: CreateKind; href?: string };

const paletteActions: PaletteAction[] = [
  ...(["task", "project", "note", "resource"] as const).map((kind) => ({
    id: `new-${kind}`,
    group: "Create" as const,
    label: `New ${kind}`,
    keywords: `new add create ${kind}`,
    create: kind
  })),
  ...allNavItems.map((item) => ({
    id: `go-${item.href}`,
    group: "Go to" as const,
    label: item.label,
    keywords: `go open ${item.label}`.toLowerCase(),
    href: item.href
  }))
];

type SearchResult = {
  type: string;
  id: string;
  title: string;
  subtitle?: string;
  href: string;
  external?: boolean;
};

// Other controls (the phone header's search button) open the palette by
// dispatching this event, so only one palette and one ⌘K listener exist.
export const OPEN_SEARCH_EVENT = "jabx:open-search";

export function openSearch() {
  window.dispatchEvent(new Event(OPEN_SEARCH_EVENT));
}

export function GlobalSearch() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [entered, setEntered] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>();
  const open = mounted;

  function openPalette() {
    window.clearTimeout(closeTimer.current);
    setMounted(true);
  }

  function closePalette() {
    setEntered(false);
    closeTimer.current = setTimeout(() => setMounted(false), EXIT_DURATION);
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        openPalette();
      }
      if (event.key === "Escape") {
        closePalette();
      }
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_SEARCH_EVENT, openPalette);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_SEARCH_EVENT, openPalette);
    };
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, [mounted]);

  useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 80);
    } else {
      setQuery("");
      setResults([]);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const trimmed = query.trim();
    if (trimmed.length < 1) {
      setResults([]);
      return;
    }

    setLoading(true);
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal
        });
        const data = await res.json();
        setResults(data.results ?? []);
      } catch {
        /* aborted or failed */
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query, open]);

  function runAction(action: PaletteAction) {
    closePalette();
    if (action.create) {
      // Let the palette close first so focus lands in the new dialog.
      setTimeout(() => openCreate(action.create as CreateKind), EXIT_DURATION);
    } else if (action.href) {
      router.push(action.href);
    }
  }

  const trimmed = query.trim().toLowerCase();
  const actions = trimmed
    ? paletteActions.filter((action) => trimmed.split(/\s+/).every((word) => action.keywords.includes(word)))
    : paletteActions;

  // Arrow keys move between items; Enter in the search box picks the first.
  function onPaletteKey(event: React.KeyboardEvent<HTMLDivElement>) {
    const items = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>("[data-palette-item]"));
    if (items.length === 0) return;
    const index = items.indexOf(document.activeElement as HTMLButtonElement);
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const next = event.key === "ArrowDown" ? index + 1 : index - 1;
      if (next < 0) inputRef.current?.focus();
      else items[Math.min(next, items.length - 1)].focus();
    } else if (event.key === "Enter" && document.activeElement === inputRef.current) {
      event.preventDefault();
      items[0].click();
    }
  }

  function openResult(result: SearchResult) {
    closePalette();
    if (result.external) {
      window.open(result.href, "_blank", "noopener,noreferrer");
    } else {
      router.push(result.href);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openPalette}
        className="flex h-10 w-full items-center gap-2.5 rounded-xl border border-border bg-background px-3 text-sm font-medium text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
      >
        <Search className="h-4 w-4" aria-hidden="true" />
        <span className="flex-1 text-left">Search</span>
        <kbd className="rounded-md border border-border px-1.5 py-0.5 font-sans text-xs">⌘K</kbd>
      </button>

      {mounted
        ? createPortal(
            <div
              className={cn(
                "fixed inset-0 z-50 flex items-start justify-center bg-[#07111B]/70 p-4 pt-[12vh] transition-opacity ease-spring motion-reduce:transition-none",
                entered ? "opacity-100 duration-200" : "opacity-0 duration-150"
              )}
              onClick={closePalette}
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-label="Search"
                className={cn(
                  "w-full max-w-xl overflow-hidden rounded-3xl border border-border bg-surface transition ease-spring motion-reduce:transition-opacity",
                  entered
                    ? "translate-y-0 scale-100 opacity-100 duration-200"
                    : "-translate-y-2 scale-95 opacity-0 duration-150"
                )}
                onClick={(event) => event.stopPropagation()}
                onKeyDown={onPaletteKey}
              >
                <div className="flex items-center gap-3 border-b border-border px-5 py-4">
                  <Search className="h-5 w-5 text-muted-foreground" />
                  <input
                    ref={inputRef}
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search, or type a command…"
                    aria-label="Search or run a command"
                    className="w-full bg-transparent text-base outline-none placeholder:text-muted-foreground"
                  />
                </div>

                <div className="max-h-[55vh] overflow-y-auto p-2">
                  {(["Create", "Go to"] as const).map((group) => {
                    const items = actions.filter((action) => action.group === group);
                    if (items.length === 0 || (trimmed && group === "Go to" && results.length > 0 && items.length > 3)) return null;
                    return (
                      <div key={group} className="mb-1">
                        <p className="px-4 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{group}</p>
                        {items.map((action) => (
                          <button
                            key={action.id}
                            type="button"
                            data-palette-item
                            onClick={() => runAction(action)}
                            className="flex w-full items-center gap-3 rounded-2xl px-4 py-2.5 text-left text-sm font-semibold outline-none transition-colors hover:bg-muted focus-visible:bg-muted"
                          >
                            {action.create ? (
                              <Plus className="h-4 w-4 text-primary" aria-hidden="true" />
                            ) : (
                              <ArrowRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                            )}
                            <span className="flex-1">{action.label}</span>
                            {action.id === "new-task" ? (
                              <kbd className="rounded-md border border-border px-1.5 text-xs font-medium text-muted-foreground">N</kbd>
                            ) : null}
                          </button>
                        ))}
                      </div>
                    );
                  })}
                  {trimmed.length === 0 ? null : loading && results.length === 0 ? (
                    <p className="px-4 py-6 text-center text-sm text-muted-foreground">Searching…</p>
                  ) : results.length === 0 ? (
                    actions.length === 0 ? (
                      <p className="px-4 py-6 text-center text-sm text-muted-foreground">No matches for &ldquo;{query}&rdquo;.</p>
                    ) : null
                  ) : (
                    <p className="px-4 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Results</p>
                  )}
                  {trimmed.length === 0
                    ? null
                    : results.map((result) => (
                      <button
                        key={`${result.type}-${result.id}`}
                        type="button"
                        data-palette-item
                        onClick={() => openResult(result)}
                        className="flex w-full items-start gap-3 rounded-2xl px-4 py-3 text-left outline-none transition-colors hover:bg-muted focus-visible:bg-muted"
                      >
                        <span
                          className={cn(
                            "mt-0.5 inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border px-2.5 py-0.5 text-xs font-semibold before:h-1.5 before:w-1.5 before:rounded-full before:bg-current",
                            recordTypeTone[result.type] ?? "text-muted-foreground"
                          )}
                        >
                          {result.type}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-1.5 text-sm font-semibold">
                            <span className="truncate">{result.title}</span>
                            {result.external ? (
                              <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            ) : null}
                          </span>
                          {result.subtitle ? (
                            <span className="mt-0.5 line-clamp-1 block text-xs text-muted-foreground">
                              {result.subtitle}
                            </span>
                          ) : null}
                        </span>
                      </button>
                    ))}
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
