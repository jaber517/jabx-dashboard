import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { isAuthed } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: { default: "Jaber's Dashboard", template: "%s · Jaber" }
};

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  return <AppShell showNavigation={await isAuthed()}>{children}</AppShell>;
}
