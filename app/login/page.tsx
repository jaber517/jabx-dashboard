import type { Metadata } from "next";
import Image from "next/image";
import { LandingNav } from "@/components/landing/landing-nav";
import { login } from "@/lib/auth-actions";
import { fraunces } from "@/lib/fonts";

export const metadata: Metadata = {
  title: "Sign in — Jaber",
  description: "Private area for Jaber's dashboard."
};

export default function LoginPage({
  searchParams
}: {
  searchParams: { error?: string };
}) {
  return (
    <div className="min-h-screen bg-[#faf4ec] text-[#211d16]">
      <div className="mx-auto max-w-6xl px-6 sm:px-10">
        <LandingNav />

        <section className="mx-auto max-w-md py-20 text-center md:py-28">
          <span className="relative mx-auto block h-20 w-20 overflow-hidden rounded-full bg-white ring-4 ring-[#ffd15c]">
            <Image src="/logo.jpg" alt="Jaber logo" fill className="object-cover" />
          </span>

          <h1
            className={`${fraunces.className} mt-8 text-4xl font-bold leading-tight tracking-tight`}
          >
            Private area{" "}
            <span aria-hidden="true">🔒</span>
          </h1>

          <p className="mt-4 text-lg text-[#4c463d]">
            Please enter the passcode below.
          </p>

          {searchParams.error ? (
            <p className="mt-6 rounded-2xl bg-[#fde5d8] px-4 py-3 text-sm font-medium text-[#a13c11]">
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
              className="h-12 w-full rounded-full border border-[#211d16]/15 bg-white px-5 text-center text-sm outline-none transition placeholder:text-[#4c463d]/60 focus:ring-2 focus:ring-[#f79a6b]"
            />
            <button
              type="submit"
              className="h-12 rounded-full bg-[#f79a6b] text-sm font-semibold text-[#211d16] shadow-[0_2px_0_rgba(33,29,22,0.25)] transition hover:bg-[#f58b54]"
            >
              Sign in
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
