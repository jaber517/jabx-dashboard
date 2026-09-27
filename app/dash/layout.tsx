import type { Metadata } from "next";
import type { ReactNode } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { currentSession } from "@/lib/auth";
import { getShellData } from "@/lib/data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  // Added to an iPhone Home Screen, open full screen like an app (needed for
  // reminder notifications on iOS).
  appleWebApp: { capable: true, title: "jabx", statusBarStyle: "black-translucent" },
  title: { default: "Jaber's Dashboard", template: "%s · Jaber" }
};

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await currentSession();
  if (!session) {
    // The middleware only checks the cookie's signature and expiry; a session
    // signed out from Settings lands here and goes back to sign-in.
    if (headers().get("x-jabx-path") !== "/login") redirect("/login");
    return <AppShell showNavigation={false}>{children}</AppShell>;
  }
  const shell = await getShellData();
  return (
    <AppShell
      projects={shell.projects}
      counts={{ openTasks: shell.openTasks, overdueTasks: shell.overdueTasks }}
      signedInWith={session.method}
    >
      {children}
    </AppShell>
  );
}
