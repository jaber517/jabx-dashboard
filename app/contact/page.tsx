import type { Metadata } from "next";
import { LandingNav } from "@/components/landing/landing-nav";
import { fraunces } from "@/lib/fonts";

export const metadata: Metadata = {
  title: "Contact — Jaber",
  description: "Get in touch with Jaber."
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#faf4ec] text-[#211d16]">
      <div className="mx-auto max-w-6xl px-6 sm:px-10">
        <LandingNav />

        <section className="mx-auto max-w-2xl py-20 text-center md:py-28">
          <h1
            className={`${fraunces.className} text-4xl font-bold leading-tight tracking-tight sm:text-5xl`}
          >
            Say{" "}
            <span className="relative inline-block">
              hello
              <svg
                className="absolute -bottom-2 left-0 w-full"
                viewBox="0 0 80 12"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M3 8c15-5 28-4 37-2s24 3 37-3"
                  stroke="#3fb6ff"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
              </svg>
            </span>{" "}
            <span aria-hidden="true">✉️</span>
          </h1>

          <p className="mt-7 text-lg leading-relaxed text-[#4c463d] sm:text-xl">
            Whether it&apos;s about engineering, travel, or the next adventure —
            I&apos;d love to hear from you.
          </p>

          <a
            href="mailto:hello@jabx.me"
            className="mt-10 inline-block rounded-full bg-[#f79a6b] px-8 py-4 text-base font-semibold text-[#211d16] shadow-[0_2px_0_rgba(33,29,22,0.25)] transition hover:bg-[#f58b54]"
          >
            Email me
          </a>
        </section>
      </div>
    </div>
  );
}
