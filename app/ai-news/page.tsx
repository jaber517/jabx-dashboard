import type { Metadata } from "next";
import { PublicHeader } from "@/components/public/public-header";
import { PublicFooter } from "@/components/public/public-footer";
import { SpringIn } from "@/components/public/spring-in";
import { AiNewsPanel } from "@/components/public/ai-news-panel";
import { plexMono } from "@/lib/fonts";

export const metadata: Metadata = {
  title: { absolute: "AI News — jabx" },
  description: "Latest AI headlines from OpenAI, Hugging Face, and Hacker News, pulled on demand."
};

export default function AiNewsPage() {
  return (
    <div className="min-h-screen bg-[#06080D] text-[#EDF1F8]">
      <PublicHeader />

      <main className="mx-auto max-w-[760px] px-6 py-16 sm:py-24">
        <SpringIn>
          <span className={`${plexMono.className} text-[11px] tracking-[0.04em] text-[#0A84FF]`}>digest</span>
          <h1 className="m-0 mb-3 mt-2 text-4xl font-semibold tracking-[-0.02em] sm:text-5xl">AI News</h1>
          <p className="m-0 mb-10 max-w-[54ch] text-[15px] leading-[1.65] text-[#8A94A6]">
            Pulled on demand from a handful of AI labs, blogs, and tech news feeds — no auto-refresh, no infinite scroll.
          </p>
          <AiNewsPanel />
        </SpringIn>
      </main>

      <PublicFooter />
    </div>
  );
}
