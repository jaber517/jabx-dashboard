"use client";

import { startAuthentication } from "@simplewebauthn/browser";
import { teamStepUpOptions, teamStepUpVerify } from "@/lib/team-step-up";

// Face ID before Approve, Request changes, Decline, Start run and Cancel run. A good check
// sets a 120-second cookie bound to this session; while it is still valid we do not ask again.

export type StepUpResult = { ok: true } | { ok: false; reason: "no_passkey" | "cancelled" | "failed"; message: string };

// A few seconds' margin so a proof does not expire between the check and the request.
const MARGIN_MS = 5_000;
let validUntilMs = 0;
let inFlight: Promise<StepUpResult> | null = null;

export const stepUpFresh = (now = Date.now()) => now < validUntilMs - MARGIN_MS;

/** The laptop refused the proof (expired or from another session): ask again next time. */
export function forgetStepUp() {
  validUntilMs = 0;
}

async function verify(): Promise<StepUpResult> {
  try {
    const options = await teamStepUpOptions();
    if ("error" in options) return { ok: false, reason: "no_passkey", message: "No passkey on this account" };
    const response = await startAuthentication({ optionsJSON: options });
    const result = await teamStepUpVerify(response);
    if (!result.ok) {
      return result.error === "passkey_required"
        ? { ok: false, reason: "no_passkey", message: "This device's passkey is not on this account" }
        : { ok: false, reason: "failed", message: "Face ID did not confirm it. Nothing was sent." };
    }
    validUntilMs = result.expiresAt * 1000;
    return { ok: true };
  } catch (cause) {
    const name = cause instanceof Error ? cause.name : "";
    if (name === "NotAllowedError" || name === "AbortError") {
      return { ok: false, reason: "cancelled", message: "Cancelled. Nothing was sent." };
    }
    return { ok: false, reason: "failed", message: cause instanceof Error ? cause.message : "Face ID failed. Nothing was sent." };
  }
}

/** Runs the Face ID check, sharing one prompt between actions that ask at the same time. */
export function stepUp(): Promise<StepUpResult> {
  if (stepUpFresh()) return Promise.resolve({ ok: true });
  inFlight ??= verify().finally(() => {
    inFlight = null;
  });
  return inFlight;
}
