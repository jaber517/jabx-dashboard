import type { ReactNode } from "react";
import { TopNav } from "@/components/navigation/top-nav";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[26rem] bg-[radial-gradient(circle_at_top,_rgba(247,154,107,0.14),_transparent_45%)]" />
      <div className="pointer-events-none absolute right-[-8rem] top-24 h-72 w-72 rounded-full bg-[#ffd15c]/15 blur-3xl" />
      <div className="pointer-events-none absolute left-[-8rem] top-56 h-72 w-72 rounded-full bg-[#f79a6b]/15 blur-3xl" />
      <TopNav />
      <main>{children}</main>
    </div>
  );
}
