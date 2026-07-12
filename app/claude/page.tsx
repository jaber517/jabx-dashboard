import type { Metadata } from "next";
import { fraunces } from "@/lib/fonts";

export const metadata: Metadata = {
  title: "Claude Learning Hub — jabx.me",
  description: "A learning hub about Claude. Coming soon."
};

function ClaudeMark({ className }: { className?: string }) {
  const rays = [
    { angle: 0, length: 40 },
    { angle: 30, length: 32 },
    { angle: 60, length: 38 },
    { angle: 90, length: 33 },
    { angle: 120, length: 40 },
    { angle: 150, length: 31 },
    { angle: 180, length: 38 },
    { angle: 210, length: 34 },
    { angle: 240, length: 40 },
    { angle: 270, length: 32 },
    { angle: 300, length: 37 },
    { angle: 330, length: 33 }
  ];

  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden="true">
      {rays.map((ray) => (
        <g key={ray.angle} transform={`rotate(${ray.angle} 100 100)`}>
          <rect
            x="94"
            y={100 - 58}
            width="12"
            height={ray.length}
            rx="6"
            fill="currentColor"
          />
        </g>
      ))}
    </svg>
  );
}

export default function ClaudeHubPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#faf4ec] px-6 text-center text-[#211d16]">
      <ClaudeMark className="h-32 w-32 text-[#d97757] sm:h-40 sm:w-40" />

      <h1
        className={`${fraunces.className} mt-10 text-4xl font-bold leading-tight tracking-tight sm:text-6xl`}
      >
        Claude Learning Hub
      </h1>

      <p className="mt-5 max-w-xl text-lg leading-relaxed text-[#4c463d] sm:text-xl">
        Guides, experiments, and everything I&apos;m learning about building with
        Claude — all in one place.
      </p>

      <p className="mt-12 rounded-full border border-[#211d16]/15 bg-white px-6 py-2.5 text-sm font-medium uppercase tracking-[0.3em] text-[#4c463d]">
        Coming soon
      </p>
    </div>
  );
}
