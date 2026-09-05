"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { ExternalLink, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { recordTypeTone } from "@/lib/constants";
import { buttonVariants } from "@/components/ui/button";

const EXIT_DURATION = 160;

type SearchResult = {
  type: string;
  id: string;
  title: string;
  subtitle?: string;
  href: string;
  external?: boolean;
};

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
    return () => window.removeEventListener("keydown", onKey);
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
        className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "gap-2")}
      >
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline">Search</span>
      </button>

      {mounted
        ? createPortal(
            <div
              className={cn(
                "fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-[12vh] backdrop-blur-sm transition-opacity ease-spring motion-reduce:transition-none",
                entered ? "opacity-100 duration-200" : "opacity-0 duration-150"
              )}
              onClick={closePalette}
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-label="Search"
                className={cn(
                  "w-full max-w-xl overflow-hidden rounded-3xl border border-border bg-surface-elevated shadow-glass transition ease-spring motion-reduce:transition-opacity",
                  entered
                    ? "translate-y-0 scale-100 opacity-100 duration-200"
                    : "-translate-y-2 scale-95 opacity-0 duration-150"
                )}
                onClick={(event) => event.stopPropagation()}
              >
                <div className="flex items-center gap-3 border-b border-border px-5 py-4">
                  <Search className="h-5 w-5 text-muted-foreground" />
                  <input
                    ref={inputRef}
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search projects, tasks, notes, resources..."
                    className="w-full bg-transparent text-base outline-none placeholder:text-muted-foreground"
                  />
                </div>

                <div className="max-h-[50vh] overflow-y-auto p-2">
                  {query.trim().length === 0 ? (
                    <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                      Start typing to search across everything.
                    </p>
                  ) : loading && results.length === 0 ? (
                    <p className="px-4 py-8 text-center text-sm text-muted-foreground">Searching...</p>
                  ) : results.length === 0 ? (
                    <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                      No matches for &ldquo;{query}&rdquo;.
                    </p>
                  ) : (
                    results.map((result) => (
                      <button
                        key={`${result.type}-${result.id}`}
                        type="button"
                        onClick={() => openResult(result)}
                        className="flex w-full items-start gap-3 rounded-2xl px-4 py-3 text-left transition ease-spring hover:bg-muted active:scale-[0.98] motion-reduce:active:scale-100"
                      >
                        <span
                          className={cn(
                            "mt-0.5 shrink-0 rounded-full px-2.5 py-1 text-xs font-medium",
                            recordTypeTone[result.type] ?? "bg-muted text-muted-foreground"
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
                    ))
                  )}
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
