import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { PwaProvider } from "@/components/providers/pwa-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Command Center",
  description:
    "An offline-first personal dashboard for projects, tasks, notes, analytics, and timelines."
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f8fc" },
    { media: "(prefers-color-scheme: dark)", color: "#0d1320" }
  ]
};

export default function RootLayout({
  children
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <PwaProvider />
          <AppShell>{children}</AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
