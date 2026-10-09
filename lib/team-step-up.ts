"use server";

import { cookies, headers } from "next/headers";
import { notFound } from "next/navigation";
import {
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  type AuthenticationResponseJSON
} from "@simplewebauthn/server";
import { assertAuthed, currentSessionId, relyingParty } from "@/lib/auth";
import { findPasskey, listPasskeys, markPasskeyUsed } from "@/lib/auth-store";
import { isPrivateHost } from "@/lib/hosts";
import { setWebAuthnChallenge, takeWebAuthnChallenge } from "@/lib/webauthn-challenge";
import {
  createTeamStepUpCookieValue,
  TEAM_STEP_UP_COOKIE,
  TEAM_STEP_UP_SECONDS
} from "@/lib/team-step-up-cookie";

function requirePrivateHost() {
  if (!isPrivateHost(headers().get("host") ?? "")) notFound();
}

type StepUpResult = { ok: true; expiresAt: number } | { ok: false; error: string };

/** Starts a fresh user-verifying passkey assertion for a team action. */
export async function teamStepUpOptions() {
  requirePrivateHost();
  await assertAuthed();
  const passkeys = await listPasskeys();
  if (passkeys.length === 0) return { error: "passkey_required" as const };

  const { rpID } = relyingParty();
  const options = await generateAuthenticationOptions({
    rpID,
    userVerification: "required",
    allowCredentials: passkeys.map((passkey) => ({
      id: passkey.id,
      transports: passkey.transports ? (passkey.transports.split(",") as never) : undefined
    }))
  });
  await setWebAuthnChallenge(options.challenge, "step-up");
  return options;
}

/** Verifies Face ID/passkey and binds a 120-second proof to this dash session. */
export async function teamStepUpVerify(response: AuthenticationResponseJSON): Promise<StepUpResult> {
  requirePrivateHost();
  try {
    await assertAuthed();
    const sessionId = await currentSessionId();
    if (!sessionId) return { ok: false, error: "step_up_required" };

    const passkey = await findPasskey(response.id);
    if (!passkey) return { ok: false, error: "passkey_required" };

    const { rpID, origin } = relyingParty();
    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge: await takeWebAuthnChallenge("step-up"),
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: true,
      credential: {
        id: passkey.id,
        publicKey: new Uint8Array(Buffer.from(passkey.publicKey, "base64url")),
        counter: passkey.counter,
        transports: passkey.transports ? (passkey.transports.split(",") as never) : undefined
      }
    });
    if (!verification.verified) return { ok: false, error: "step_up_required" };

    await markPasskeyUsed(passkey.id, verification.authenticationInfo.newCounter);
    const checkedAt = Math.floor(Date.now() / 1000);
    const value = await createTeamStepUpCookieValue(sessionId, checkedAt);
    cookies().set(TEAM_STEP_UP_COOKIE, value, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: TEAM_STEP_UP_SECONDS
    });
    return { ok: true, expiresAt: checkedAt + TEAM_STEP_UP_SECONDS };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Step-up failed." };
  }
}
