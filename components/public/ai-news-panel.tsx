"use client";

import { useState } from "react";
import { plexMono } from "@/lib/fonts";

type NewsItem = { title: string; link: string; source: string; pubDate: string };

export function AiNewsPanel() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [pulled, setPulled] = useState(false);

  async function pullNews() {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/ai-news");
      const data = await res.json();
      setNews(data.items ?? []);
      setPulled(true);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={pullNews}
        disabled={loading}
        className={`${plexMono.className} rounded-lg bg-[#0A84FF] px-4 py-2.5 text-[13px] text-[#04101F] transition-colors hover:bg-[#3D9EFF] disabled:opacity-50`}
      >
        {loading ? "pulling..." : "pull latest"}
      </button>

      <ul className="mt-6 flex flex-col divide-y divide-[#1D2330] border-t border-[#1D2330]">
        {news.map((item) => (
          <li key={item.link} className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 py-4">
            <a href={item.link} target="_blank" rel="noreferrer" className="text-[15px] text-[#EDF1F8] hover:text-[#0A84FF]">
              {item.title}
            </a>
            <span className={`${plexMono.className} shrink-0 text-[11px] text-[#8A94A6]`}>{item.source}</span>
          </li>
        ))}
      </ul>

      {news.length === 0 ? (
        <p className="mt-4 text-sm text-[#8A94A6]">
          {error ? "Couldn't reach the feeds — try again." : pulled ? "No headlines right now." : "Nothing pulled yet."}
        </p>
      ) : null}
    </div>
  );
}
