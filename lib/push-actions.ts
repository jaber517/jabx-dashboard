"use server";

import { headers } from "next/headers";
import { assertAuthed } from "@/lib/auth";
import { deleteSubscription, pushConfigured, saveSubscription, sendToAll } from "@/lib/push";

type Result = { ok: true } | { ok: false; error: string };

type BrowserSubscription = { endpoint?: string; keys?: { p256dh?: string; auth?: string } };

function parse(sub: BrowserSubscription) {
  const { endpoint, keys } = sub;
  if (!endpoint || !/^https:\/\//.test(endpoint) || !keys?.p256dh || !keys.auth) throw new Error("That subscription looks invalid.");
  return { endpoint, p256dh: keys.p256dh, auth: keys.auth };
}

export async function subscribeToReminders(sub: BrowserSubscription): Promise<Result> {
  await assertAuthed();
  if (!pushConfigured()) return { ok: false, error: "Reminders aren't set up on this server." };
  try {
    await saveSubscription(parse(sub), headers().get("user-agent") ?? "");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Couldn't turn reminders on." };
  }
}

export async function unsubscribeFromReminders(endpoint: string): Promise<void> {
  await assertAuthed();
  await deleteSubscription(endpoint);
}

export async function sendTestReminder(endpoint: string): Promise<Result> {
  await assertAuthed();
  const { sent } = await sendToAll(
    { title: "Reminders are on", body: "You'll get a summary of what's due each morning.", url: "/dashboard", tag: "test" },
    { endpoint }
  );
  return sent > 0 ? { ok: true } : { ok: false, error: "The test didn't go through. Try turning reminders off and on again." };
}
