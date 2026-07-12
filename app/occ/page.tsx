import type { Metadata } from "next";
import { fraunces } from "@/lib/fonts";

export const metadata: Metadata = {
  title: "OCC — AI-Powered Operations Command Center",
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-black px-6 text-center text-white">
      <div className="flex flex-col items-center gap-8 sm:flex-row sm:gap-10 sm:text-left">
        <OccMark className="h-36 w-36 shrink-0 text-white sm:h-44 sm:w-44" />
        <div className="hidden h-40 w-px bg-white/60 sm:block" />
        <div>
          <h1 className={`${fraunces.className} text-6xl font-bold tracking-tight sm:text-7xl`}>
            OCC
          </h1>
          <p className="mt-2 max-w-xs text-xl leading-snug text-white/85">
            AI-Powered Operations Command Center
          </p>
        </div>
      </div>

      <p className="mt-14 rounded-full border border-white/25 px-6 py-2.5 text-sm font-medium uppercase tracking-[0.3em] text-white/70">
        Coming soon
      </p>
    </div>
  );
}
