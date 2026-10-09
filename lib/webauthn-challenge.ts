import "server-only";

import { cookies } from "next/headers";
import { CHALLENGE_COOKIE, sign, unsign } from "@/lib/auth-config";

export type WebAuthnChallengePurpose = "register" | "login" | "step-up";

const CHALLENGE_MINUTES: Record<WebAuthnChallengePurpose, number> = {
  register: 5,
  login: 15,
  "step-up": 5
};

const cookieBase = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/"
};

export async function setWebAuthnChallenge(challenge: string, purpose: WebAuthnChallengePurpose) {
  const minutes = CHALLENGE_MINUTES[purpose];
  const value = await sign(`${challenge}:${purpose}:${Date.now() + minutes * 60_000}`);
  if (!value) throw new Error("Sign-in is not configured.");
  cookies().set(CHALLENGE_COOKIE, value, { ...cookieBase, maxAge: minutes * 60 });
}

export async function takeWebAuthnChallenge(purpose: WebAuthnChallengePurpose): Promise<string> {
  const payload = await unsign(cookies().get(CHALLENGE_COOKIE)?.value);
  cookies().delete(CHALLENGE_COOKIE);
  const [challenge, forPurpose, expires] = payload?.split(":") ?? [];
  if (!challenge || forPurpose !== purpose || Number(expires) < Date.now()) {
    throw new Error("That took too long. Please try again.");
  }
  return challenge;
}
