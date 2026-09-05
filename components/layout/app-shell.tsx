import type { ReactNode } from "react";
import { Atmosphere } from "@/components/public/atmosphere";
import { TopNav } from "@/components/navigation/top-nav";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <Atmosphere />
      <TopNav />
      <main>{children}</main>
    </div>
  );
}
