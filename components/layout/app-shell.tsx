import type { ReactNode } from "react";
import { GlobalCreate } from "@/components/navigation/global-create";
import { MobileNavigation, Sidebar, type NavCounts } from "@/components/navigation/sidebar";
import { UndoProvider } from "@/components/providers/undo-provider";
import { PasskeyPrompt } from "@/features/auth/passkey-prompt";

export function AppShell({
  children,
  showNavigation = true,
  projects = [],
  counts,
  signedInWith
}: {
  children: ReactNode;
  showNavigation?: boolean;
  projects?: { id: string; title: string }[];
  counts?: NavCounts;
  /** How this device signed in ("passcode" or "passkey"). */
  signedInWith?: string;
}) {
  if (!showNavigation) return <main>{children}</main>;

  return (
    <UndoProvider>
      <div className="flex min-h-screen">
        <Sidebar counts={counts} />
        <div className="min-w-0 flex-1">
          <MobileNavigation />
          <main>{children}</main>
        </div>
      </div>
      <GlobalCreate projects={projects} />
      <PasskeyPrompt signedInWith={signedInWith} />
    </UndoProvider>
  );
}
