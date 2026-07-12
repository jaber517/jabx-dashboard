import { createHash } from "crypto";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "jabx_session";

export function sessionToken(): string | null {
  const password = process.env.DASHBOARD_PASSWORD;

  if (!password) {
    return null;
  }

  return createHash("sha256").update(`${password}:jabx-session-v1`).digest("hex");
}

export function isAuthed(): boolean {
  const expected = sessionToken();
  return Boolean(expected && cookies().get(SESSION_COOKIE)?.value === expected);
}

export function assertAuthed(): void {
  if (!isAuthed()) {
    throw new Error("You must be signed in to do that.");
  }
}
