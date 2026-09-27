"use server";

import { notFound, redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { revalidatePath } from "next/cache";
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
  type AuthenticationResponseJSON,
  type RegistrationResponseJSON
} from "@simplewebauthn/server";
import { isPrivateHost } from "@/lib/hosts";
import { CHALLENGE_COOKIE, SESSION_COOKIE, sign, unsign, verifyPasscode } from "@/lib/auth-config";
import {
  clearFailures,
  createSession,
  deleteOtherSessions,
  deletePasskey,
  deleteSession,
  findPasskey,
  listPasskeys,
  markPasskeyUsed,
  passcodeLocked,
  recordFailure,
  savePasskey
} from "@/lib/auth-store";
import { assertAuthed, clientIp, currentSessionId, relyingParty, userAgent } from "@/lib/auth";
import { deviceName } from "@/lib/device-name";

function requirePrivateHost() {
  if (!isPrivateHost(headers().get("host") ?? "")) notFound();
}

const cookieBase = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/"
};

async function startSession(method: "passcode" | "passkey") {
  const { cookie, expiresAt } = await createSession(method, userAgent());
  cookies().set(SESSION_COOKIE, cookie, { ...cookieBase, expires: expiresAt });
}

// ------------------------------------------------------------ passcode

export async function login(formData: FormData): Promise<void> {
  requirePrivateHost();
  const ip = clientIp();
  if (await passcodeLocked(ip)) redirect("/login?error=locked");

  const password = formData.get("password");
  if (typeof password !== "string" || !(await verifyPasscode(password))) {
    await recordFailure(ip);
    // Slow each wrong guess down on top of the lockout.
    await new Promise((resolve) => setTimeout(resolve, 1000));
    redirect("/login?error=1");
  }

  await clearFailures(ip);
  await startSession("passcode");
  redirect("/dashboard");
}

export async function logout(): Promise<void> {
  requirePrivateHost();
  const id = await currentSessionId();
  if (id) await deleteSession(id);
  cookies().delete(SESSION_COOKIE);
  redirect("/login");
}

// ------------------------------------------------------------- passkeys

// The WebAuthn challenge rides in a short-lived signed cookie between the
// "options" and "verify" steps, tagged with what it is for. Sign-in gets
// longer because the autofill request waits on the page until it is used.
const CHALLENGE_MINUTES = { register: 5, login: 15 } as const;

async function setChallenge(challenge: string, purpose: "register" | "login") {
  const minutes = CHALLENGE_MINUTES[purpose];
  const value = await sign(`${challenge}:${purpose}:${Date.now() + minutes * 60_000}`);
  if (!value) throw new Error("Sign-in is not configured.");
  cookies().set(CHALLENGE_COOKIE, value, { ...cookieBase, maxAge: minutes * 60 });
}

async function takeChallenge(purpose: "register" | "login"): Promise<string> {
  const payload = await unsign(cookies().get(CHALLENGE_COOKIE)?.value);
  cookies().delete(CHALLENGE_COOKIE);
  const [challenge, forPurpose, expires] = payload?.split(":") ?? [];
  if (!challenge || forPurpose !== purpose || Number(expires) < Date.now()) {
    throw new Error("That took too long. Please try again.");
  }
  return challenge;
}

type Result = { ok: true } | { ok: false; error: string };

const USER_ID = new TextEncoder().encode("jabx-dashboard-owner");

/** Step 1 of adding a passkey (signed in only). */
export async function passkeyRegistrationOptions() {
  requirePrivateHost();
  await assertAuthed();
  const { rpID } = relyingParty();
  const existing = await listPasskeys();
  const options = await generateRegistrationOptions({
    rpName: "jabx dashboard",
    rpID,
    userID: USER_ID,
    userName: "jaber",
    userDisplayName: "Jaber",
    attestationType: "none",
    excludeCredentials: existing.map((key) => ({
      id: key.id,
      transports: key.transports ? (key.transports.split(",") as never) : undefined
    })),
    // "platform": save it on this device (iCloud Keychain, Windows Hello…)
    // with Face ID / Touch ID, rather than offering a phone QR code.
    authenticatorSelection: { authenticatorAttachment: "platform", residentKey: "required", userVerification: "required" }
  });
  await setChallenge(options.challenge, "register");
  return options;
}

/** Step 2 of adding a passkey: verify and store it. */
export async function passkeyRegistrationVerify(response: RegistrationResponseJSON): Promise<Result> {
  requirePrivateHost();
  try {
    await assertAuthed();
    const { rpID, origin } = relyingParty();
    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge: await takeChallenge("register"),
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: true
    });
    if (!verification.verified || !verification.registrationInfo) return { ok: false, error: "That passkey couldn't be verified." };
    const { credential } = verification.registrationInfo;
    await savePasskey({
      id: credential.id,
      publicKey: Buffer.from(credential.publicKey).toString("base64url"),
      counter: credential.counter,
      transports: credential.transports ?? [],
      name: deviceName(userAgent())
    });
    revalidatePath("/dash/settings");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Couldn't add the passkey." };
  }
}

/** Step 1 of signing in with a passkey. Any saved passkey may answer. */
export async function passkeyLoginOptions() {
  requirePrivateHost();
  const { rpID } = relyingParty();
  const options = await generateAuthenticationOptions({ rpID, userVerification: "required" });
  await setChallenge(options.challenge, "login");
  return options;
}

/** Step 2 of signing in with a passkey: verify, then start a session. */
export async function passkeyLoginVerify(response: AuthenticationResponseJSON): Promise<Result> {
  requirePrivateHost();
  try {
    const { rpID, origin } = relyingParty();
    const passkey = await findPasskey(response.id);
    if (!passkey) return { ok: false, error: "This passkey isn't registered here. Sign in with your passcode, then add it in Settings." };
    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge: await takeChallenge("login"),
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
    if (!verification.verified) return { ok: false, error: "That passkey couldn't be verified." };
    await markPasskeyUsed(passkey.id, verification.authenticationInfo.newCounter);
    await startSession("passkey");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Sign-in failed." };
  }
}

export async function removePasskey(id: string): Promise<void> {
  requirePrivateHost();
  await assertAuthed();
  await deletePasskey(id);
  revalidatePath("/dash/settings");
}

// ------------------------------------------------------------- devices

export async function signOutDevice(id: string): Promise<void> {
  requirePrivateHost();
  await assertAuthed();
  const current = await currentSessionId();
  await deleteSession(id);
  if (id === current) {
    cookies().delete(SESSION_COOKIE);
    redirect("/login");
  }
  revalidatePath("/dash/settings");
}

export async function signOutOtherDevices(): Promise<void> {
  requirePrivateHost();
  await assertAuthed();
  const current = await currentSessionId();
  if (current) await deleteOtherSessions(current);
  revalidatePath("/dash/settings");
}
