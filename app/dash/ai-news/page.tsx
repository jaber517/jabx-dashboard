import type { Metadata } from "next";
import { AiNewsView } from "@/features/ai-news/ai-news-view";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "AI News" };

export default function AiNewsPage() {
  return <AiNewsView />;
}
