import { plexMono } from "@/lib/fonts";

export function PublicFooter() {
  return (
    <footer className="border-t border-[#1D2330]">
      <div
        className={`${plexMono.className} mx-auto flex max-w-[1080px] flex-col gap-2 px-6 py-6 text-xs tracking-[0.02em] text-[#8A94A6] sm:flex-row sm:justify-between`}
      >
        <span>jabx.me</span>
        <span>© 2026</span>
      </div>
    </footer>
  );
}
