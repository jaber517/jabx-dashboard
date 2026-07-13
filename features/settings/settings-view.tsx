"use client";

import { useTheme } from "next-themes";
import { Database, LogOut, MonitorSmartphone, Moon, ShieldCheck, Sun } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { cn } from "@/lib/utils";
import { logout } from "@/lib/auth-actions";

const THEME_OPTIONS = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: MonitorSmartphone }
] as const;

export type SettingsStats = {
  projectCount: number;
  activeProjectCount: number;
  taskCount: number;
  doneTaskCount: number;
  noteCount: number;
  resourceCount: number;
};

export function SettingsView({ stats }: { stats: SettingsStats }) {
  const { theme, setTheme } = useTheme();

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="System"
        title="Settings"
        description="Appearance, access, and a quick look at what's stored in your dashboard."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Sun className="h-5 w-5" />
            </div>
            <CardTitle className="mt-2">Appearance</CardTitle>
            <CardDescription>Choose how the dashboard looks on this device.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-3">
            {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setTheme(value)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-2xl border px-4 py-4 text-sm font-medium transition",
                  theme === value
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border bg-surface text-muted-foreground hover:bg-muted"
                )}
              >
                <Icon className="h-5 w-5" />
                {label}
              </button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f79a6b]/15 text-[#c2571f] dark:text-[#f79a6b]">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <CardTitle className="mt-2">Access</CardTitle>
            <CardDescription>This dashboard is locked behind a passcode, just for you.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-6 text-muted-foreground">
              Signing in keeps you in for 30 days on this device. To change the
              passcode, update the <code>DASHBOARD_PASSWORD</code> value in the
              project&apos;s environment variables and redeploy.
            </p>
            <form action={logout}>
              <Button type="submit" variant="secondary" className="gap-2">
                <LogOut className="h-4 w-4" />
                Log out of this device
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
              <Database className="h-5 w-5" />
            </div>
            <CardTitle className="mt-2">Data overview</CardTitle>
            <CardDescription>What&apos;s currently stored in your dashboard.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-2xl border border-border bg-surface p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Projects</p>
              <p className="mt-2 text-2xl font-semibold">{stats.projectCount}</p>
              <p className="mt-1 text-xs text-muted-foreground">{stats.activeProjectCount} active</p>
            </div>
            <div className="rounded-2xl border border-border bg-surface p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Tasks</p>
              <p className="mt-2 text-2xl font-semibold">{stats.taskCount}</p>
              <p className="mt-1 text-xs text-muted-foreground">{stats.doneTaskCount} done</p>
            </div>
            <div className="rounded-2xl border border-border bg-surface p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Notes</p>
              <p className="mt-2 text-2xl font-semibold">{stats.noteCount}</p>
            </div>
            <div className="rounded-2xl border border-border bg-surface p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Resources</p>
              <p className="mt-2 text-2xl font-semibold">{stats.resourceCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
