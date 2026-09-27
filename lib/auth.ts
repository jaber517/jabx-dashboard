import { cookies, headers } from "next/headers";
import { SESSION_COOKIE, readSessionCookie, sha256Hex } from "@/lib/auth-config";
import { findSession } from "@/lib/auth-store";
import { hostnameWithoutPort, isPrivateHost } from "@/lib/hosts";

export { SESSION_COOKIE };

/** The current device's session (id is the stored hash), or null. */
export async function currentSession() {
  if (!isPrivateHost(headers().get("host") ?? "")) return null;
  const cookie = await readSessionCookie(cookies().get(SESSION_COOKIE)?.value);
  if (!cookie) return null;
  try {
    return await findSession(cookie.token);
  } catch {
    return null;
  }
}

export async function currentSessionId(): Promise<string | null> {
  const cookie = await readSessionCookie(cookies().get(SESSION_COOKIE)?.value);
  return cookie ? sha256Hex(cookie.token) : null;
}

export async function isAuthed(): Promise<boolean> {
  return Boolean(await currentSession());
}

export async function assertAuthed(): Promise<void> {
  if (!(await isAuthed())) {
    throw new Error("You must be signed in to do that.");
  }
}

export function clientIp(): string {
  const forwarded = headers().get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headers().get("x-real-ip") || "unknown";
}

export function userAgent(): string {
  return headers().get("user-agent") ?? "";
}

/** WebAuthn relying party: this dashboard host and its exact origin. */
export function relyingParty() {
  const host = headers().get("host") ?? "";
  if (!isPrivateHost(host)) throw new Error("Not available here.");
  const hostname = hostnameWithoutPort(host);
  const local = hostname === "localhost" || hostname.endsWith(".localhost");
  const proto = local ? "http" : "https";
  return { rpID: hostname, origin: `${proto}://${host}` };
}
