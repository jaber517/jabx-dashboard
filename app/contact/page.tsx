import type { Metadata } from "next";
import { Instagram } from "lucide-react";
import { LandingNav } from "@/components/landing/landing-nav";
import { fraunces } from "@/lib/fonts";

export const metadata: Metadata = {
  title: "Contact — Jaber",
  description: "Get in touch with Jaber."
};

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

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
            <span aria-hidden="true">👋</span>
          </h1>

          <p className="mt-7 text-lg leading-relaxed text-[#4c463d] sm:text-xl">
            Got a question, a project idea, or a mountain I should know about?
            I&apos;d love to hear from you. Pick whichever way suits you best.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href="mailto:admin@jabx.me"
              className="inline-flex h-13 items-center gap-2 rounded-full bg-[#f79a6b] px-7 py-3.5 text-base font-semibold text-[#211d16] shadow-[0_2px_0_rgba(33,29,22,0.25)] transition hover:bg-[#f58b54]"
            >
              ✉️ Email me
            </a>

            <a
              href="https://instagram.com/jabx.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 rounded-full bg-[linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)] px-7 py-3.5 text-base font-semibold text-white shadow-[0_2px_0_rgba(33,29,22,0.25)] transition hover:opacity-90"
            >
              <Instagram className="h-5 w-5" />
              @jabx.ai
            </a>

            <a
              href="https://wa.me/96541095120"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 rounded-full bg-[#25d366] px-7 py-3.5 text-base font-semibold text-white shadow-[0_2px_0_rgba(33,29,22,0.25)] transition hover:bg-[#1fb959]"
            >
              <WhatsAppIcon className="h-5 w-5" />
              WhatsApp
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
