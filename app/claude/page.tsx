import type { Metadata } from "next";
import { Atmosphere } from "@/components/public/atmosphere";
import { PublicHeader } from "@/components/public/public-header";
import { PublicFooter } from "@/components/public/public-footer";
import { SpringIn } from "@/components/public/spring-in";
import { plexMono } from "@/lib/fonts";

export const metadata: Metadata = {
  title: { absolute: "Claude Learning Hub — jabx.me" },
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
    <div className="flex min-h-screen flex-col bg-[#06080D] text-[#EDF1F8]">
      <Atmosphere />
      <PublicHeader />

      <main className="flex flex-1 flex-col items-center justify-center px-6 py-20 text-center">
        <SpringIn>
          <div className="flex flex-col items-center">
            <ClaudeMark className="h-28 w-28 text-[#d97757] sm:h-32 sm:w-32" />

            <h1 className="m-0 mt-8 text-4xl font-semibold leading-[1.1] tracking-[-0.025em] sm:text-5xl">
              Claude Learning Hub
            </h1>

            <p className="mt-4 max-w-xl text-lg leading-[1.65] text-[#8A94A6] sm:text-xl">
              Guides, experiments, and everything I&apos;m learning about building with
              Claude — all in one place.
            </p>

            <p
              className={`${plexMono.className} mt-10 rounded-full border border-white/[0.08] px-6 py-2.5 text-xs tracking-[0.3em] text-[#8A94A6]`}
            >
              COMING SOON
            </p>
          </div>
        </SpringIn>
      </main>

      <PublicFooter />
    </div>
  );
}
