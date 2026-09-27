"use client";

import { useEffect, useState, useTransition } from "react";
import { browserSupportsWebAuthn } from "@simplewebauthn/browser";
import { Fingerprint, KeyRound, MonitorSmartphone, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useUndo } from "@/components/providers/undo-provider";
import { removePasskey, signOutDevice, signOutOtherDevices } from "@/lib/auth-actions";
import { addPasskeyOnThisDevice } from "@/features/auth/passkey-client";
import { formatRelativeDate } from "@/lib/formatters";

export type SecurityData = {
  passkeys: { id: string; name: string; createdAt: string; lastUsedAt: string | null }[];
  sessions: { id: string; device: string; method: string; lastSeenAt: string; current: boolean }[];
};

function when(value: string) {
  return formatRelativeDate(value);
}

export function SecuritySettings({ passkeys, sessions }: SecurityData) {
  const [pending, startTransition] = useTransition();
  const [supported, setSupported] = useState(true);
  const [error, setError] = useState("");
  const { notify } = useUndo();
  const others = sessions.filter((session) => !session.current);

  useEffect(() => setSupported(browserSupportsWebAuthn()), []);

  function addPasskey() {
    setError("");
    startTransition(async () => {
      const result = await addPasskeyOnThisDevice();
      if (result.ok) notify("Passkey added. Next time, pick it from the passcode field.");
      else setError(result.error);
    });
  }

  return (
    <div className="grid gap-6 lg:col-span-2 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border text-primary">
            <Fingerprint className="h-5 w-5" aria-hidden="true" />
          </div>
          <CardTitle className="mt-2">Passkeys</CardTitle>
          <CardDescription>
            Sign in with Face ID, Touch ID or your device PIN. If your browser asks where to save the passkey,
            choose iCloud Keychain: it then syncs to Safari, Chrome on your Mac and your iPhone.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {passkeys.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
              No passkeys yet. Add one to sign in without typing your passcode.
            </p>
          ) : (
            <ul className="divide-y divide-border rounded-2xl border border-border">
              {passkeys.map((key) => (
                <li key={key.id} className="flex items-center gap-3 px-4 py-3">
                  <KeyRound className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{key.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Added {when(key.createdAt)}
                      {key.lastUsedAt ? ` · last used ${when(key.lastUsedAt)}` : " · not used yet"}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={pending}
                    onClick={() => {
                      if (passkeys.length === 1 && !window.confirm("Remove your only passkey? You'll need the passcode to sign in.")) return;
                      startTransition(() => removePasskey(key.id));
                    }}
                  >
                    Remove
                  </Button>
                </li>
              ))}
            </ul>
          )}
          {supported ? (
            <Button type="button" onClick={addPasskey} disabled={pending} className="gap-2">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add a passkey on this device
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground">This browser doesn&apos;t support passkeys.</p>
          )}
          {error ? (
            <p role="alert" className="text-sm font-medium text-danger">
              {error}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border text-primary">
            <MonitorSmartphone className="h-5 w-5" aria-hidden="true" />
          </div>
          <CardTitle className="mt-2">Signed-in devices</CardTitle>
          <CardDescription>Each sign-in lasts 30 days. Sign out anything you don&apos;t recognise.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="divide-y divide-border rounded-2xl border border-border">
            {sessions.map((session) => (
              <li key={session.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 truncate text-sm font-semibold">
                    {session.device}
                    {session.current ? <Badge className="text-tone-green">This device</Badge> : null}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {session.method === "passkey" ? "Passkey" : "Passcode"} · active {when(session.lastSeenAt)}
                  </p>
                </div>
                <Button variant="ghost" size="sm" disabled={pending} onClick={() => startTransition(() => signOutDevice(session.id))}>
                  Sign out
                </Button>
              </li>
            ))}
          </ul>
          {others.length > 0 ? (
            <Button
              type="button"
              variant="secondary"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  await signOutOtherDevices();
                  notify(`Signed out ${others.length} other device${others.length === 1 ? "" : "s"}.`);
                })
              }
            >
              Sign out all other devices
            </Button>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
