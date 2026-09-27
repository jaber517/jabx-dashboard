"use client";

import { useEffect, useState, useTransition } from "react";
import { browserSupportsWebAuthn, startAuthentication } from "@simplewebauthn/browser";
import { Fingerprint } from "lucide-react";
import { Button } from "@/components/ui/button";
import { passkeyLoginOptions, passkeyLoginVerify } from "@/lib/auth-actions";

// "Sign in with passkey": Face ID / Touch ID / device PIN, then straight in.
export function PasskeySignIn() {
  const [supported, setSupported] = useState<boolean | null>(null);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  useEffect(() => setSupported(browserSupportsWebAuthn()), []);

  if (supported === false) return null;

  function signIn() {
    setError("");
    startTransition(async () => {
      try {
        const optionsJSON = await passkeyLoginOptions();
        const response = await startAuthentication({ optionsJSON });
        const result = await passkeyLoginVerify(response);
        if (result.ok) window.location.assign("/dashboard");
        else setError(result.error);
      } catch (cause) {
        const name = cause instanceof Error ? cause.name : "";
        setError(
          name === "NotAllowedError"
            ? "Cancelled, or no passkey on this device yet."
            : cause instanceof Error
              ? cause.message
              : "Sign-in failed."
        );
      }
    });
  }

  return (
    <div className="grid gap-3">
      <Button type="button" onClick={signIn} disabled={pending || supported === null} className="h-12 w-full gap-2.5 text-[15px]">
        <Fingerprint className="h-5 w-5" aria-hidden="true" />
        {pending ? "Waiting for your passkey…" : "Sign in with passkey"}
      </Button>
      {error ? (
        <p role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      ) : null}
      <div className="my-1 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        or use your passcode
        <span className="h-px flex-1 bg-border" />
      </div>
    </div>
  );
}
