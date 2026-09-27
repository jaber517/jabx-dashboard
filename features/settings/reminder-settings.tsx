"use client";

import { useEffect, useState, useTransition } from "react";
import { Bell, Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useUndo } from "@/components/providers/undo-provider";
import { sendTestReminder, subscribeToReminders, unsubscribeFromReminders } from "@/lib/push-actions";

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

type State = "loading" | "unconfigured" | "needs-home-screen" | "unsupported" | "blocked" | "off" | "on";

function keyBytes(base64url: string) {
  const padded = (base64url + "=".repeat((4 - (base64url.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
}

async function registration() {
  return (await navigator.serviceWorker.getRegistration()) ?? navigator.serviceWorker.register("/sw.js");
}

export function ReminderSettings({ devices }: { devices: number }) {
  const [state, setState] = useState<State>("loading");
  const [endpoint, setEndpoint] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const { notify } = useUndo();

  useEffect(() => {
    (async () => {
      if (!PUBLIC_KEY) return setState("unconfigured");
      const iOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
      const standalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (navigator as Navigator & { standalone?: boolean }).standalone === true;
      if (iOS && !standalone) return setState("needs-home-screen");
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
        return setState("unsupported");
      }
      if (Notification.permission === "denied") return setState("blocked");
      const existing = await (await registration()).pushManager.getSubscription();
      if (existing) {
        setEndpoint(existing.endpoint);
        setState("on");
      } else {
        setState("off");
      }
    })().catch(() => setState("unsupported"));
  }, []);

  function turnOn() {
    setError("");
    startTransition(async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          setState(permission === "denied" ? "blocked" : "off");
          return;
        }
        const reg = await registration();
        await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(PUBLIC_KEY) });
        const result = await subscribeToReminders(sub.toJSON());
        if (!result.ok) {
          await sub.unsubscribe();
          setError(result.error);
          return;
        }
        setEndpoint(sub.endpoint);
        setState("on");
        notify("Reminders are on for this device.");
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Couldn't turn reminders on.");
      }
    });
  }

  function turnOff() {
    setError("");
    startTransition(async () => {
      const sub = await (await registration()).pushManager.getSubscription();
      await sub?.unsubscribe();
      await unsubscribeFromReminders(endpoint || sub?.endpoint || "");
      setEndpoint("");
      setState("off");
      notify("Reminders are off for this device.");
    });
  }

  function test() {
    setError("");
    startTransition(async () => {
      const result = await sendTestReminder(endpoint);
      if (result.ok) notify("Test sent. It should arrive in a few seconds.");
      else setError(result.error);
    });
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border text-primary">
          <Bell className="h-5 w-5" aria-hidden="true" />
        </div>
        <CardTitle className="mt-2">Reminders</CardTitle>
        <CardDescription>
          A notification each morning at about 8 am with what&apos;s due today and what&apos;s overdue. Nothing due means no
          notification.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {state === "needs-home-screen" ? (
          <div className="space-y-2 rounded-2xl border border-border p-4 text-sm leading-6">
            <p className="font-semibold">On iPhone, add the dashboard to your Home Screen first:</p>
            <ol className="list-decimal space-y-1 pl-5 text-muted-foreground">
              <li>
                In Safari, tap <Share className="inline h-4 w-4 align-[-2px]" aria-label="Share" /> Share, then{" "}
                <span className="font-semibold text-foreground">Add to Home Screen</span>.
              </li>
              <li>Open jabx from your Home Screen and sign in (your passkey works there).</li>
              <li>Come back to Settings and turn reminders on.</li>
            </ol>
          </div>
        ) : null}
        {state === "unsupported" ? <p className="text-sm text-muted-foreground">This browser can&apos;t show notifications.</p> : null}
        {state === "unconfigured" ? <p className="text-sm text-muted-foreground">Reminders aren&apos;t set up on this server yet.</p> : null}
        {state === "blocked" ? (
          <p className="text-sm leading-6 text-muted-foreground">
            Notifications are blocked for this site. Allow them in your browser or phone settings (on iPhone: Settings →
            Notifications → jabx), then reload this page.
          </p>
        ) : null}
        {state === "off" ? (
          <Button type="button" onClick={turnOn} disabled={pending} className="gap-2">
            <Bell className="h-4 w-4" aria-hidden="true" />
            Turn on reminders on this device
          </Button>
        ) : null}
        {state === "on" ? (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-tone-green">Reminders are on for this device.</p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" onClick={test} disabled={pending}>
                Send a test
              </Button>
              <Button type="button" variant="ghost" onClick={turnOff} disabled={pending}>
                Turn off
              </Button>
            </div>
          </div>
        ) : null}
        {devices > 0 ? (
          <p className="text-[13px] text-muted-foreground">
            {devices} device{devices === 1 ? "" : "s"} receiving reminders.
          </p>
        ) : null}
        {error ? (
          <p role="alert" className="text-sm font-medium text-danger">
            {error}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
