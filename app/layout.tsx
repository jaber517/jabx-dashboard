import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { PwaProvider } from "@/components/providers/pwa-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { fraunces } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Jaber's Dashboard",
    template: "%s · Jaber"
  },
  description:
    "A personal dashboard for projects, tasks, notes, analytics, and timelines.",
  icons: {
    icon: "/logo.jpg",
    apple: "/logo.jpg"
  }
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf4ec" },
    { media: "(prefers-color-scheme: dark)", color: "#0d1320" }
  ]
};

export default function RootLayout({
  children
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className={fraunces.variable}>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <PwaProvider />
          <AppShell>{children}</AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
