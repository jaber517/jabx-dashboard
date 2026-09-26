import type { ReactNode } from "react";
import { MobileNavigation, Sidebar } from "@/components/navigation/sidebar";

export function AppShell({ children, showNavigation = true }: { children: ReactNode; showNavigation?: boolean }) {
  if (!showNavigation) return <main>{children}</main>;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="min-w-0 flex-1">
        <MobileNavigation />
        <main>{children}</main>
      </div>
    </div>
  );
}
