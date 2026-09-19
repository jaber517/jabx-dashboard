import { cookies, headers } from "next/headers";
import { SESSION_COOKIE, expectedSessionToken } from "@/lib/auth-config";
import { isPrivateHost } from "@/lib/hosts";

export { SESSION_COOKIE };

export async function isAuthed(): Promise<boolean> {
  if (!isPrivateHost(headers().get("host") ?? "")) return false;
  const session = cookies().get(SESSION_COOKIE)?.value;
  const expected = await expectedSessionToken();
  return Boolean(session && expected && session === expected);
}

export async function assertAuthed(): Promise<void> {
  if (!(await isAuthed())) {
    throw new Error("You must be signed in to do that.");
  }
}
