import type { ReactNode } from "react";
import { Atmosphere } from "@/components/public/atmosphere";
import { TopNav } from "@/components/navigation/top-nav";

export function AppShell({ children, showNavigation = true }: { children: ReactNode; showNavigation?: boolean }) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <Atmosphere />
      {showNavigation ? <TopNav /> : null}
      <main>{children}</main>
    </div>
  );
}
