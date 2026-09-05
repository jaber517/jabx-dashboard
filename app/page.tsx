import type { Metadata } from "next";
import { PublicHeader } from "@/components/public/public-header";
import { PublicFooter } from "@/components/public/public-footer";
import { SpringIn } from "@/components/public/spring-in";
import { SpotlightCard } from "@/components/public/spotlight-card";
import { plexMono } from "@/lib/fonts";

export const metadata: Metadata = {
  title: { absolute: "jabx — AI solutions lab" },
  description:
    "jabx is a small AI solutions lab — tools designed, built, and tested before they ship."
};

const builtProjects = [
  {
    tag: "internal tool",
    title: "jabx-dashboard",
    description:
      "A personal hub that consolidates OCC, HSE, training and AI project workspaces in one place.",
    href: "/dashboard"
  },
  {
    tag: "hobby build",
    title: "Weekly planner",
    description:
      "Saturday–Friday, 30-minute slots, a live now-indicator. Built because nothing off-the-shelf fit.",
    href: "#"
  },
  {
    tag: "workspace",
    title: "OCC",
    description: "Offshore compliance and crew notes, kept somewhere I can actually find them again.",
    href: "#"
  }
];

const labProjects = [
  {
    tag: "wip",
    title: "Rig report summarizer",
    description:
      "Feeding weekly OCC reports through Claude to draft the fleet email automatically. Half-working."
  },
  {
    tag: "idea",
    title: "Voice notes → tasks",
    description: "Talking a task list into existence instead of typing it. Prototype stage."
  },
  {
    tag: "testing",
    title: "Planner, server-side",
    description: "Moving the weekly planner off localStorage so it syncs across devices."
  }
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#06080D] text-[#EDF1F8]">
      <PublicHeader />

      <main className="mx-auto max-w-[1080px] px-6">
        <section className="grid gap-6 py-16 sm:py-22 md:grid-cols-[1.5fr_1fr] md:items-stretch">
          <SpringIn>
            <h1 className="m-0 mb-[22px] text-[2.75rem] font-semibold leading-[1.04] tracking-[-0.025em] sm:text-[4rem] lg:text-[4.5rem]">
              Building AI-assisted tools for real problems.
            </h1>
            <p className="m-0 max-w-[46ch] text-[17px] leading-[1.65] text-[#8A94A6]">
              jabx is a small AI solutions lab — tools designed, built, and tested
              before they ship. Some are already running below.{" "}
              <a href="#lab" className="border-b border-white/[0.08] text-[#EDF1F8] transition-colors hover:border-[#0A84FF]">
                Some are still in the lab.
              </a>
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {["dashboards", "automation", "ai tooling"].map((pill) => (
                <span
                  key={pill}
                  className={`${plexMono.className} rounded-full border border-white/[0.08] px-3 py-[5px] text-[11px] tracking-[0.04em] text-[#8A94A6]`}
                >
                  {pill}
                </span>
              ))}
            </div>
          </SpringIn>

          <SpringIn delay={70}>
            <div
              className="flex h-full flex-col justify-center gap-3.5 rounded-xl border border-white/[0.08] p-[22px]"
              style={{
                background: "rgba(18, 22, 31, 0.55)",
                backdropFilter: "blur(24px) saturate(160%)",
                WebkitBackdropFilter: "blur(24px) saturate(160%)",
                borderTopColor: "rgba(255, 255, 255, 0.14)",
                boxShadow: "0 24px 60px -24px rgba(0, 0, 0, 0.65)"
              }}
            >
              <div className="flex items-center gap-2 text-xs tracking-[0.04em] text-[#8A94A6]">
                <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-[#0A84FF] motion-reduce:animate-none" />
                status
              </div>
              {[
                ["mode", "testing"],
                ["running", "3 experiments"],
                ["focus", "ai + automation"]
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between gap-3 text-[13px]">
                  <span className={`${plexMono.className} tracking-[0.03em] text-[#8A94A6]`}>{k}</span>
                  <span className={`${plexMono.className} tracking-[0.03em] text-[#EDF1F8]`}>{v}</span>
                </div>
              ))}
            </div>
          </SpringIn>
        </section>

        <section className="border-t border-[#1D2330] py-14 sm:py-20">
          <p className="mb-5 text-[13px] text-[#8A94A6]">built — shipped, running</p>
          <div className="grid divide-y divide-[#1D2330] overflow-hidden rounded-xl border border-[#1D2330] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {builtProjects.map((project, i) => (
              <SpringIn key={project.title} delay={140 + i * 70}>
                <SpotlightCard href={project.href} glow="signal" className="h-full rounded-none">
                  <span className={`${plexMono.className} text-[11px] tracking-[0.04em] text-[#0A84FF]`}>
                    {project.tag}
                  </span>
                  <h3 className="m-0 text-lg font-semibold tracking-[-0.005em]">{project.title}</h3>
                  <p className="m-0 text-sm leading-[1.55] text-[#8A94A6]">{project.description}</p>
                  <span
                    className={`${plexMono.className} mt-auto pt-2 text-[13px] text-[#8A94A6] transition-colors group-hover:text-[#EDF1F8]`}
                  >
                    view →
                  </span>
                </SpotlightCard>
              </SpringIn>
            ))}
          </div>
        </section>

        <section id="lab" className="border-t border-[#1D2330] py-2 pb-16 sm:pb-20">
          <div className="mb-5 flex items-baseline justify-between">
            <p className="m-0 text-[13px] text-[#8A94A6]">lab — early, unfinished, might break</p>
            <span className={`${plexMono.className} text-xs text-[#8A94A6]`}>3 running</span>
          </div>
          <div className="grid gap-3.5 sm:grid-cols-3">
            {labProjects.map((project, i) => (
              <SpringIn key={project.title} delay={350 + i * 70}>
                <SpotlightCard dashed glow="amber" className="h-full">
                  <span className={`${plexMono.className} text-[11px] tracking-[0.04em] text-[#F5A623]`}>
                    {project.tag}
                  </span>
                  <h4 className="mb-1 mt-2 text-[15px] font-medium text-[#EDF1F8]">{project.title}</h4>
                  <p className="m-0 text-[13px] leading-[1.5] text-[#8A94A6]">{project.description}</p>
                </SpotlightCard>
              </SpringIn>
            ))}
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
