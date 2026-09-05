import type { Metadata } from "next";
import Image from "next/image";
import { PublicHeader } from "@/components/public/public-header";
import { PublicFooter } from "@/components/public/public-footer";
import { SpringIn } from "@/components/public/spring-in";

export const metadata: Metadata = {
  title: { absolute: "About — jabx" },
  description: "Who's behind jabx."
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#06080D] text-[#EDF1F8]">
      <PublicHeader />

      <main className="mx-auto max-w-[1080px] px-6">
        <section className="grid items-center gap-14 py-16 sm:py-24 md:grid-cols-[1fr_1.4fr]">
          <SpringIn>
            <div className="relative mx-auto h-60 w-60 sm:h-72 sm:w-72">
              <div
                className="absolute inset-0 rounded-full blur-2xl"
                style={{
                  background:
                    "radial-gradient(circle, rgba(10,132,255,0.28), rgba(124,111,255,0.14) 60%, transparent 75%)"
                }}
              />
              <div className="absolute inset-4 overflow-hidden rounded-full border border-white/[0.08] bg-[#12161F] shadow-[0_24px_60px_-24px_rgba(0,0,0,0.65)]">
                <Image
                  src="/logo.jpg"
                  alt="Portrait illustration of Jaber"
                  fill
                  priority
                  className="object-cover"
                />
              </div>
            </div>
          </SpringIn>

          <SpringIn delay={70}>
            <div className="text-center md:text-left">
              <h1 className="m-0 mb-[22px] text-4xl font-semibold leading-[1.1] tracking-[-0.025em] sm:text-5xl">
                About{" "}
                <span className="relative inline-block">
                  me
                  <svg
                    className="absolute -bottom-2 left-0 w-full"
                    viewBox="0 0 60 12"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M3 8c11-5 21-4 27-2s18 3 27-3"
                      stroke="#0A84FF"
                      strokeWidth="5"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              </h1>

              <p className="mx-auto max-w-xl text-lg leading-[1.65] text-[#8A94A6] sm:text-xl md:mx-0">
                AI Engineer. Building AI solutions out of a small lab — where ideas
                get tested, refined, and shipped. The focus is practical: tools
                people actually use, built with care and a bit of experimentation
                along the way.
              </p>
            </div>
          </SpringIn>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
