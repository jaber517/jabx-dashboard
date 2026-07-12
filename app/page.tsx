import type { Metadata } from "next";
import Image from "next/image";
import { LandingNav } from "@/components/landing/landing-nav";
import { fraunces } from "@/lib/fonts";

export const metadata: Metadata = {
  title: "Jaber — jabx.me",
  description:
    "Mechanical Engineer. Traveler. Mountain lover. Always learning, always exploring, and always ready for the next adventure."
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#faf4ec] text-[#211d16]">
      <div className="mx-auto max-w-6xl px-6 sm:px-10">
        <LandingNav />

        <section className="grid items-center gap-14 py-14 md:grid-cols-2 md:py-24">
          <div className="relative mx-auto h-72 w-72 sm:h-[22rem] sm:w-[22rem]">
            <div className="absolute inset-0 rotate-6 rounded-[46%_54%_52%_48%/52%_46%_54%_48%] bg-[#ffd15c]" />
            <div className="absolute inset-5 overflow-hidden rounded-full bg-white shadow-[0_20px_50px_-20px_rgba(33,29,22,0.35)]">
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
              className={`${fraunces.className} text-5xl font-bold leading-tight tracking-tight sm:text-6xl`}
            >
              Hi, I&apos;m{" "}
              <span className="relative inline-block">
                Jaber
                <svg
                  className="absolute -bottom-2 left-0 w-full"
                  viewBox="0 0 120 12"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M3 8c22-6 42-5 57-2s40 3 57-3"
                    stroke="#3fb6ff"
                    strokeWidth="5"
                    strokeLinecap="round"
                  />
                </svg>
              </span>{" "}
              <span aria-hidden="true">👋</span>
            </h1>

            <p className="mx-auto mt-7 max-w-xl text-xl leading-relaxed text-[#4c463d] sm:text-2xl md:mx-0">
              Mechanical Engineer. Traveler. Mountain lover. Always learning, always
              exploring, and always ready for the next adventure.{" "}
              <strong className="font-semibold text-[#211d16] underline decoration-2 underline-offset-4">
                Welcome to my website.
              </strong>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
