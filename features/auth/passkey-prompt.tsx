"use client";

import { useEffect, useState } from "react";
import { platformAuthenticatorIsAvailable } from "@simplewebauthn/browser";
import { Fingerprint, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUndo } from "@/components/providers/undo-provider";
import { addPasskeyOnThisDevice, hasPasskeyOnDevice } from "@/features/auth/passkey-client";

const SNOOZE_KEY = "jabx:passkey-prompt-snoozed-until";
const SNOOZE_DAYS = 14;

// After a passcode sign-in on a device with Face ID / Touch ID (or Windows
// Hello) and no passkey yet, offer to add one. "Not now" hides it for two weeks.
export function PasskeyPrompt({ signedInWith }: { signedInWith?: string }) {
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const { notify } = useUndo();

  useEffect(() => {
    if (signedInWith !== "passcode" || hasPasskeyOnDevice()) return;
    try {
      if (Number(localStorage.getItem(SNOOZE_KEY)) > Date.now()) return;
    } catch {
      return;
    }
    platformAuthenticatorIsAvailable().then(setShow, () => setShow(false));
  }, [signedInWith]);

  function snooze() {
    try {
      localStorage.setItem(SNOOZE_KEY, String(Date.now() + SNOOZE_DAYS * 86_400_000));
    } catch {
      /* storage unavailable */
    }
    setShow(false);
  }

  async function setUp() {
    setBusy(true);
    setError("");
    const result = await addPasskeyOnThisDevice();
    setBusy(false);
    if (result.ok) {
      setShow(false);
      notify("Passkey added. Next time, pick it from the passcode field.");
    } else if (result.error) {
      setError(result.error);
    }
  }

  if (!show) return null;

  return (
    <aside
      aria-labelledby="passkey-prompt-title"
      className="fixed inset-x-4 bottom-20 z-[55] rounded-3xl border border-border bg-surface p-5 animate-drop-in sm:left-auto sm:right-6 sm:w-[380px] lg:bottom-6"
    >
      <button
        type="button"
        onClick={snooze}
        aria-label="Not now"
        className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border text-primary">
        <Fingerprint className="h-5 w-5" aria-hidden="true" />
      </div>
      <h2 id="passkey-prompt-title" className="mt-3 text-[17px] font-bold">
        Sign in with Face ID next time?
      </h2>
      <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
        Add a passkey on this device and skip the passcode. If your browser asks where to save it, choose{" "}
        <span className="font-semibold text-foreground">iCloud Keychain</span> so Safari and your iPhone can use it too.
      </p>
      {error ? (
        <p role="alert" className="mt-2 text-sm font-medium text-danger">
          {error}
        </p>
      ) : null}
      <div className="mt-4 flex gap-2">
        <Button type="button" onClick={setUp} disabled={busy}>
          {busy ? "Waiting…" : "Set up"}
        </Button>
        <Button type="button" variant="ghost" onClick={snooze} disabled={busy}>
          Not now
        </Button>
      </div>
    </aside>
  );
}
