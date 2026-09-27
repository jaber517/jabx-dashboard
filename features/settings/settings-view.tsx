"use client";

import { useTheme } from "next-themes";
import { Database, LogOut, MonitorSmartphone, Moon, ShieldCheck, Sun } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { cn } from "@/lib/utils";
import { logout } from "@/lib/auth-actions";
import { SecuritySettings, type SecurityData } from "@/features/settings/security-settings";

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

export function SettingsView({ stats, security }: { stats: SettingsStats; security: SecurityData }) {
  const { theme: storedTheme, setTheme } = useTheme();
  // Nothing saved yet means the default, which follows the system.
  const theme = storedTheme ?? "system";

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
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border text-primary">
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
                aria-pressed={theme === value}
                onClick={() => setTheme(value)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-2xl border px-4 py-4 text-sm font-medium transition ease-spring active:scale-95 motion-reduce:active:scale-100",
                  theme === value
                    ? "border-primary bg-muted font-semibold text-primary"
                    : "border-border bg-surface text-muted-foreground hover:border-primary hover:text-foreground"
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
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <CardTitle className="mt-2">Access</CardTitle>
            <CardDescription>Passkeys are the everyday way in; the passcode is the backup.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-6 text-muted-foreground">
              After 5 wrong passcodes an address is locked out for 15 minutes. To change the passcode,
              update <code>DASHBOARD_PASSWORD</code> in the project&apos;s environment variables and
              redeploy; that also signs out every device.
            </p>
            <form action={logout}>
              <Button type="submit" variant="secondary" className="gap-2">
                <LogOut className="h-4 w-4" />
                Log out of this device
              </Button>
            </form>
          </CardContent>
        </Card>

        <SecuritySettings passkeys={security.passkeys} sessions={security.sessions} />

        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border text-tone-green">
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
