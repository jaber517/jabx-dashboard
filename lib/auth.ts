import { cookies } from "next/headers";
import { SESSION_COOKIE, expectedSessionToken } from "@/lib/auth-config";

export { SESSION_COOKIE };

export async function isAuthed(): Promise<boolean> {
  const session = cookies().get(SESSION_COOKIE)?.value;
  return Boolean(session && session === (await expectedSessionToken()));
}

export async function assertAuthed(): Promise<void> {
  if (!(await isAuthed())) {
    throw new Error("You must be signed in to do that.");
  }
}
