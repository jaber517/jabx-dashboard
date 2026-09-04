import type { Metadata } from "next";
import { Atmosphere } from "@/components/public/atmosphere";
import { PublicHeader } from "@/components/public/public-header";
import { PublicFooter } from "@/components/public/public-footer";
import { SpringIn } from "@/components/public/spring-in";
import { plexMono } from "@/lib/fonts";

export const metadata: Metadata = {
  title: { absolute: "OCC — AI-Powered Operations Command Center" },
  description: "OCC, the AI-Powered Operations Command Center. Coming soon."
};

function OccMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden="true">
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
        <g key={angle} transform={`rotate(${angle} 100 100)`}>
          <polygon
            points="100,14 78,52 92,45 92,72 108,72 108,45 122,52"
            fill="currentColor"
          />
        </g>
      ))}
    </svg>
  );
}

export default function OccPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#06080D] text-[#EDF1F8]">
      <Atmosphere />
      <PublicHeader />

      <main className="flex flex-1 flex-col items-center justify-center px-6 py-20 text-center">
        <SpringIn>
          <div className="flex flex-col items-center gap-8 sm:flex-row sm:gap-10 sm:text-left">
            <OccMark className="h-32 w-32 shrink-0 text-[#EDF1F8] sm:h-40 sm:w-40" />
            <div className="hidden h-36 w-px bg-white/[0.08] sm:block" />
            <div>
              <h1 className="m-0 text-5xl font-semibold tracking-[-0.025em] sm:text-6xl">OCC</h1>
              <p className="mt-2 max-w-xs text-lg leading-snug text-[#8A94A6]">
                AI-Powered Operations Command Center
              </p>
            </div>
          </div>

          <p
            className={`${plexMono.className} mt-14 rounded-full border border-white/[0.08] px-6 py-2.5 text-xs tracking-[0.3em] text-[#8A94A6]`}
          >
            COMING SOON
          </p>
        </SpringIn>
      </main>

      <PublicFooter />
    </div>
  );
}
