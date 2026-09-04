import type { Metadata } from "next";
import Image from "next/image";
import { Atmosphere } from "@/components/public/atmosphere";
import { PublicHeader } from "@/components/public/public-header";
import { PublicFooter } from "@/components/public/public-footer";
import { SpringIn } from "@/components/public/spring-in";
import { login } from "@/lib/auth-actions";

export const metadata: Metadata = {
  title: { absolute: "Sign in — jabx" },
  description: "Private area for Jaber's dashboard."
};

export default function LoginPage({
  searchParams
}: {
  searchParams: { error?: string };
}) {
  return (
    <div className="min-h-screen bg-[#06080D] text-[#EDF1F8]">
      <Atmosphere />
      <PublicHeader />

      <main className="mx-auto max-w-[1080px] px-6">
        <section className="mx-auto max-w-md py-20 text-center sm:py-28">
          <SpringIn>
            <span className="relative mx-auto block h-20 w-20 overflow-hidden rounded-full border border-white/[0.08] bg-[#12161F] ring-2 ring-[#0A84FF]/40">
              <Image src="/logo.jpg" alt="Jaber logo" fill className="object-cover" />
            </span>

            <h1 className="m-0 mt-8 text-4xl font-semibold leading-[1.1] tracking-[-0.025em]">
              Private area 🔒
            </h1>

            <p className="mt-4 text-lg text-[#8A94A6]">Please enter the passcode below.</p>

            {searchParams.error ? (
              <p className="mt-6 rounded-lg border border-[#3a1414] bg-[#1a0e0e] px-4 py-3 text-sm font-medium text-[#ff8080]">
                Wrong passcode — try again.
              </p>
            ) : null}

            <form action={login} className="mt-8 grid gap-3">
              <input
                type="password"
                name="password"
                placeholder="Passcode"
                inputMode="numeric"
                required
                autoFocus
                className="h-12 w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-5 text-center text-sm text-[#EDF1F8] outline-none transition placeholder:text-[#8A94A6] focus:border-[#0A84FF]/50 focus:ring-2 focus:ring-[#0A84FF]/30"
              />
              <button
                type="submit"
                className="h-12 rounded-lg bg-[#0A84FF] text-sm font-medium text-[#04101F] transition ease-spring hover:opacity-90 active:scale-[0.97] motion-reduce:active:scale-100"
              >
                Sign in
              </button>
            </form>
          </SpringIn>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
