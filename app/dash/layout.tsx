import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { isAuthed } from "@/lib/auth";
import { getShellData } from "@/lib/data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: { default: "Jaber's Dashboard", template: "%s · Jaber" }
};

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  if (!(await isAuthed())) return <AppShell showNavigation={false}>{children}</AppShell>;
  const shell = await getShellData();
  return (
    <AppShell projects={shell.projects} counts={{ openTasks: shell.openTasks, overdueTasks: shell.overdueTasks }}>
      {children}
    </AppShell>
  );
}
