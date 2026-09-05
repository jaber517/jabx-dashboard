import type { Metadata } from "next";
import { Instagram } from "lucide-react";
import { PublicHeader } from "@/components/public/public-header";
import { PublicFooter } from "@/components/public/public-footer";
import { SpringIn } from "@/components/public/spring-in";

export const metadata: Metadata = {
  title: { absolute: "Contact — jabx" },
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
    <div className="min-h-screen bg-[#06080D] text-[#EDF1F8]">
      <PublicHeader />

      <main className="mx-auto max-w-[1080px] px-6">
        <section className="mx-auto max-w-2xl py-20 text-center sm:py-28">
          <SpringIn>
            <h1 className="m-0 mb-[22px] text-4xl font-semibold leading-[1.1] tracking-[-0.025em] sm:text-5xl">
              Get in touch
            </h1>

            <p className="mx-auto max-w-md text-lg leading-[1.65] text-[#8A94A6] sm:text-xl">
              For project inquiries, collabs, or a quick hello. I&apos;d love to hear from you.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href="mailto:admin@jabx.me"
                className="inline-flex h-12 items-center gap-2 rounded-lg bg-[#0A84FF] px-6 text-[15px] font-medium text-[#04101F] transition ease-spring hover:opacity-90 active:scale-[0.97] motion-reduce:active:scale-100"
              >
                ✉️ Email me
              </a>

              <a
                href="https://instagram.com/jabx.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-6 text-[15px] font-medium text-[#EDF1F8] transition ease-spring hover:bg-white/[0.06] active:scale-[0.97] motion-reduce:active:scale-100"
              >
                <Instagram className="h-4 w-4 text-[#E1306C]" />
                @jabx.ai
              </a>

              <a
                href="https://wa.me/96541095120"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-6 text-[15px] font-medium text-[#EDF1F8] transition ease-spring hover:bg-white/[0.06] active:scale-[0.97] motion-reduce:active:scale-100"
              >
                <WhatsAppIcon className="h-4 w-4 text-[#25D366]" />
                WhatsApp
              </a>
            </div>
          </SpringIn>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
