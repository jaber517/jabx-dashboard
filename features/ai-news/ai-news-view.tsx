"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";

type NewsItem = { title: string; link: string; source: string; pubDate?: string };
type SavedNews = { version: 1; items: NewsItem[]; refreshedAt: string };
const STORAGE_KEY = "ai-news-last";

function isNewsItem(value: unknown): value is NewsItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<NewsItem>;
  return typeof item.title === "string" && typeof item.source === "string" &&
    typeof item.link === "string" && /^https?:\/\//i.test(item.link) &&
    (item.pubDate === undefined || typeof item.pubDate === "string");
}

function validDate(value?: string): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function AiNewsView() {
  const [saved, setSaved] = useState<SavedNews | null>(null);
  const [restoring, setRestoring] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      if (parsed?.version === 1 && Array.isArray(parsed.items) &&
          parsed.items.every(isNewsItem) && typeof parsed.refreshedAt === "string" && validDate(parsed.refreshedAt)) {
        setSaved(parsed);
      }
    } catch {
      // Unavailable storage or an invalid cache must not prevent refreshing.
    } finally {
      setRestoring(false);
    }
  }, []);

  async function refreshNews() {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/ai-news", { cache: "no-store" });
      if (!response.ok || response.redirected) throw new Error("News request failed");
      const data: unknown = await response.json();
      if (!data || typeof data !== "object" || !("items" in data) || !Array.isArray(data.items)) {
        throw new Error("Invalid news response");
      }
      const next: SavedNews = {
        version: 1,
        items: data.items.filter(isNewsItem),
        refreshedAt: new Date().toISOString()
      };
      setSaved(next);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // The successful result remains usable when storage is full or disabled.
      }
    } catch {
      setError("Couldn't refresh the news. Your last successful results are still here. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const items = saved?.items ?? [];
  const refreshedAt = validDate(saved?.refreshedAt);

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Reading room"
        title="AI News"
        description="Headlines from AI labs and technology news feeds, refreshed only when you ask."
        actions={<Button type="button" onClick={refreshNews} disabled={loading || restoring}>
          {loading ? "Refreshing news…" : "Refresh news"}
        </Button>}
      />
      <Card aria-busy={loading || restoring}>
        <p className="text-sm text-muted-foreground" aria-live="polite">
          Last refreshed: {refreshedAt ? <time dateTime={saved!.refreshedAt}>{refreshedAt.toLocaleString()}</time> : "Never"}
        </p>
        {error ? <p role="alert" className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-300">{error}</p> : null}
        {loading || restoring ? <p role="status" className="mt-4 text-sm text-muted-foreground">{restoring ? "Loading saved news…" : "Refreshing news…"}</p> : null}
        {items.length ? (
          <ul className="mt-5 divide-y divide-border">
            {items.map((item) => {
              const published = validDate(item.pubDate);
              return (
                <li key={`${item.source}:${item.link}`} className="py-5 first:pt-0 last:pb-0">
                  <a href={item.link} target="_blank" rel="noopener noreferrer" className="rounded text-base font-medium text-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    {item.title}
                  </a>
                  <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground">
                    <span>{item.source}</span>
                    {published ? <time dateTime={published.toISOString()}>{published.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}</time> : null}
                  </p>
                </li>
              );
            })}
          </ul>
        ) : !loading && !restoring ? (
          <div className="mt-5"><EmptyState
            title={saved ? "No headlines right now" : "Nothing refreshed yet"}
            description="Use Refresh news to fetch the latest headlines from the feeds."
          /></div>
        ) : null}
      </Card>
    </div>
  );
}
