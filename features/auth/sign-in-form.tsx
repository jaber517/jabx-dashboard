"use client";

import { useEffect, useRef, useState } from "react";
import {
  browserSupportsWebAuthn,
  browserSupportsWebAuthnAutofill,
  startAuthentication
} from "@simplewebauthn/browser";
import { Fingerprint } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { login, passkeyLoginOptions, passkeyLoginVerify } from "@/lib/auth-actions";
import { hasPasskeyOnDevice, passkeyErrorMessage, rememberPasskeyOnDevice } from "@/features/auth/passkey-client";

// Passkeys are offered three ways, fastest first:
// 1. In the passcode field's autofill list (iCloud Passwords / Chrome), next
//    to the saved passcode: tap it, Face ID, done. No QR code.
// 2. A big "Sign in with passkey" button, only on a browser that has already
//    added or used a passkey, where it goes straight to Face ID / Touch ID.
// 3. Otherwise a small link for a passkey on another device (the QR code).
export function SignInForm({ message }: { message?: string }) {
  const [supported, setSupported] = useState(false);
  const [onDevice, setOnDevice] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const armed = useRef(false);

  async function finish(response: Awaited<ReturnType<typeof startAuthentication>>) {
    setBusy(true);
    const result = await passkeyLoginVerify(response);
    if (result.ok) {
      rememberPasskeyOnDevice();
      window.location.assign("/dashboard");
      return true;
    }
    setBusy(false);
    setError(result.error);
    return false;
  }

  // Autofill: keep a passkey request waiting in the passcode field.
  async function armAutofill() {
    if (armed.current || !(await browserSupportsWebAuthnAutofill())) return;
    armed.current = true;
    try {
      const optionsJSON = await passkeyLoginOptions();
      const response = await startAuthentication({ optionsJSON, useBrowserAutofill: true });
      armed.current = false;
      if (!(await finish(response))) void armAutofill();
    } catch (cause) {
      armed.current = false;
      const text = passkeyErrorMessage(cause, "sign-in");
      // Aborted because the button started its own request: nothing to show.
      if (text && text !== "Cancelled.") setError(text);
    }
  }

  useEffect(() => {
    setSupported(browserSupportsWebAuthn());
    setOnDevice(hasPasskeyOnDevice());
    void armAutofill();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function signInWithButton() {
    setError("");
    try {
      const optionsJSON = await passkeyLoginOptions();
      const response = await startAuthentication({ optionsJSON });
      await finish(response);
    } catch (cause) {
      setError(passkeyErrorMessage(cause, "sign-in"));
      void armAutofill();
    }
  }

  return (
    <div className="mt-6 grid gap-3">
      {message ? (
        <p id="login-error" role="alert" className="rounded-2xl border border-danger/40 p-4 text-sm font-medium text-danger">
          {message}
        </p>
      ) : null}

      {supported && onDevice ? (
        <>
          <Button type="button" onClick={signInWithButton} disabled={busy} className="h-12 w-full gap-2.5 text-[15px]">
            <Fingerprint className="h-5 w-5" aria-hidden="true" />
            {busy ? "Signing in…" : "Sign in with passkey"}
          </Button>
          <div className="my-1 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            or use your passcode
            <span className="h-px flex-1 bg-border" />
          </div>
        </>
      ) : null}

      <form action={login} className="grid gap-3">
        <label htmlFor="password" className="text-sm font-semibold">
          Passcode
        </label>
        {/* "webauthn" lets the browser list saved passkeys in this field's autofill. */}
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password webauthn"
          required
          aria-invalid={Boolean(message)}
          aria-describedby={message ? "login-error" : "passkey-hint"}
        />
        <Button type="submit" variant={supported && onDevice ? "secondary" : "default"} className="mt-1 w-full">
          Sign in
        </Button>
      </form>

      {supported ? (
        <p id="passkey-hint" className="text-[13px] leading-5 text-muted-foreground">
          {onDevice ? "Your passkey also appears when you tap the passcode field." : "Have a passkey? Tap the passcode field and pick it from the list."}{" "}
          {onDevice ? null : (
            <button type="button" onClick={signInWithButton} className="font-semibold text-primary hover:underline">
              Use a passkey from another device
            </button>
          )}
        </p>
      ) : null}

      {error ? (
        <p role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
