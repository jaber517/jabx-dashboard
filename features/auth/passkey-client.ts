"use client";

import { startRegistration } from "@simplewebauthn/browser";
import { passkeyRegistrationOptions, passkeyRegistrationVerify } from "@/lib/auth-actions";

// This browser has a passkey for the dashboard (it added or used one). The
// sign-in page only makes "Sign in with passkey" the main button when this
// is set; elsewhere the button can only lead to the other-device QR code.
const DEVICE_FLAG = "jabx:passkey-on-device";

export function hasPasskeyOnDevice(): boolean {
  try {
    return localStorage.getItem(DEVICE_FLAG) === "1";
  } catch {
    return false;
  }
}

export function rememberPasskeyOnDevice() {
  try {
    localStorage.setItem(DEVICE_FLAG, "1");
  } catch {
    /* storage unavailable */
  }
}

/** Friendly text for errors thrown by the browser's WebAuthn prompt. */
export function passkeyErrorMessage(cause: unknown, action: "add" | "sign-in"): string {
  const name = cause instanceof Error ? cause.name : "";
  if (name === "NotAllowedError") return action === "add" ? "Cancelled. Nothing was added." : "Cancelled.";
  if (name === "InvalidStateError") return "This device already has a passkey for the dashboard.";
  if (name === "AbortError") return "";
  return cause instanceof Error ? cause.message : action === "add" ? "Couldn't add a passkey." : "Sign-in failed.";
}

/** Runs the whole "add a passkey on this device" flow. */
export async function addPasskeyOnThisDevice(): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const optionsJSON = await passkeyRegistrationOptions();
    const response = await startRegistration({ optionsJSON });
    const result = await passkeyRegistrationVerify(response);
    if (result.ok) rememberPasskeyOnDevice();
    return result;
  } catch (cause) {
    const name = cause instanceof Error ? cause.name : "";
    // Already registered here: the device does have one, so remember that.
    if (name === "InvalidStateError") rememberPasskeyOnDevice();
    return { ok: false, error: passkeyErrorMessage(cause, "add") };
  }
}
