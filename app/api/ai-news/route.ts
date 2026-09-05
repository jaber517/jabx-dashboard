import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const FEEDS = [
  { source: "Hugging Face", url: "https://huggingface.co/blog/feed.xml" },
  { source: "OpenAI", url: "https://openai.com/news/rss.xml" },
  { source: "DeepMind", url: "https://www.deepmind.com/blog/rss.xml" },
  { source: "TechCrunch", url: "https://techcrunch.com/category/artificial-intelligence/feed/" },
  { source: "MIT Tech Review", url: "https://www.technologyreview.com/topic/artificial-intelligence/feed" },
  { source: "Ars Technica", url: "https://arstechnica.com/ai/feed/" },
  { source: "Hacker News", url: "https://hnrss.org/newest?q=AI&count=10" }
];

type NewsItem = { title: string; link: string; source: string; pubDate: string };

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", "#039": "'", nbsp: " "
};

function decodeEntities(text: string): string {
  return text.replace(/&(#\d+|#x[0-9a-f]+|[a-z]+\d*);/gi, (full, code: string) => {
    if (code[0] === "#") {
      const codePoint = code[1]?.toLowerCase() === "x" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isNaN(codePoint) ? full : String.fromCodePoint(codePoint);
    }
    return NAMED_ENTITIES[code.toLowerCase()] ?? full;
  });
}

function tag(xml: string, name: string): string {
  const match = xml.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`));
  if (!match) return "";
  const raw = match[1].replace(/^<!\[CDATA\[([\s\S]*)\]\]>$/, "$1").trim();
  return decodeEntities(raw);
}

// ponytail: hand-rolled RSS 2.0 parsing via regex instead of an XML parser
// dependency — every feed here is plain RSS 2.0, not Atom. Swap in a real
// parser if a feed with namespaced/nested titles gets added later.
function parseFeed(xml: string, source: string): NewsItem[] {
  const items = xml.match(/<item>[\s\S]*?<\/item>/g) ?? [];
  return items.map((item) => ({
    title: tag(item, "title"),
    link: tag(item, "link"),
    pubDate: tag(item, "pubDate"),
    source
  }));
}

export async function GET() {
  const results = await Promise.allSettled(
    FEEDS.map(async ({ source, url }) => {
      const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
      if (!res.ok) throw new Error(`${source} ${res.status}`);
      return parseFeed(await res.text(), source);
    })
  );

  // Cap each feed to its 3 freshest items before merging, so a
  // high-frequency source (Hacker News) can't drown out the rest.
  const items = results
    .filter((r): r is PromiseFulfilledResult<NewsItem[]> => r.status === "fulfilled")
    .flatMap((r) => r.value.filter((item) => item.title && item.link).slice(0, 3))
    .sort((a, b) => Date.parse(b.pubDate || "") - Date.parse(a.pubDate || ""))
    .slice(0, 10);

  return NextResponse.json({ items });
}
