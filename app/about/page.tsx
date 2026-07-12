import type { Metadata } from "next";
import Image from "next/image";
import { LandingNav } from "@/components/landing/landing-nav";
import { fraunces } from "@/lib/fonts";

export const metadata: Metadata = {
  title: "About — Jaber",
  description: "Who I am and what I'm about."
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#faf4ec] text-[#211d16]">
      <div className="mx-auto max-w-6xl px-6 sm:px-10">
        <LandingNav />

        <section className="grid items-center gap-14 py-14 md:grid-cols-[1fr_1.4fr] md:py-24">
          <div className="relative mx-auto h-60 w-60 sm:h-72 sm:w-72">
            <div className="absolute inset-0 -rotate-6 rounded-[52%_48%_46%_54%/48%_54%_46%_52%] bg-[#f79a6b]" />
            <div className="absolute inset-4 overflow-hidden rounded-full bg-white shadow-[0_20px_50px_-20px_rgba(33,29,22,0.35)]">
              <Image
                src="/logo.jpg"
                alt="Portrait illustration of Jaber"
                fill
                priority
                className="object-cover"
              />
            </div>
          </div>

          <div className="text-center md:text-left">
            <h1
              className={`${fraunces.className} text-4xl font-bold leading-tight tracking-tight sm:text-5xl`}
            >
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
                    stroke="#3fb6ff"
                    strokeWidth="5"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </h1>

            <p className="mx-auto mt-7 max-w-xl text-lg leading-relaxed text-[#4c463d] sm:text-xl md:mx-0">
              I&apos;m Jaber, a Mechanical Engineer with a love for the outdoors. When
              I&apos;m not working, you&apos;ll find me planning the next trip, climbing
              the next mountain, or learning something new. This site is my little
              corner of the internet — more coming soon.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
