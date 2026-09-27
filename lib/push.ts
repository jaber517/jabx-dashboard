import "server-only";
import webpush from "web-push";
import { db } from "@/lib/db";
import { sha256Hex } from "@/lib/auth-config";

// Web Push: reminders sent to devices that turned them on in Settings.
// NEXT_PUBLIC_VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY identify this dashboard to
// the browsers' push services (Apple, Google, Mozilla).

export type PushPayload = { title: string; body: string; url?: string; tag?: string };

export function pushConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

function configure() {
  webpush.setVapidDetails(
    "mailto:contact@jabx.me",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY as string,
    process.env.VAPID_PRIVATE_KEY as string
  );
}

export async function subscriptionId(endpoint: string) {
  return sha256Hex(endpoint);
}

export async function saveSubscription(sub: { endpoint: string; p256dh: string; auth: string }, userAgent: string) {
  const id = await subscriptionId(sub.endpoint);
  await db.pushSubscription.upsert({
    where: { id },
    create: { id, ...sub, userAgent: userAgent.slice(0, 300) },
    update: { ...sub, userAgent: userAgent.slice(0, 300) }
  });
}

export async function deleteSubscription(endpoint: string) {
  await db.pushSubscription.deleteMany({ where: { id: await subscriptionId(endpoint) } });
}

export async function countSubscriptions() {
  return db.pushSubscription.count().catch(() => 0);
}

/** Sends to every subscribed device; forgets devices the push service rejects. */
export async function sendToAll(payload: PushPayload, only?: { endpoint: string }) {
  if (!pushConfigured()) return { sent: 0, removed: 0 };
  configure();
  const subscriptions = only
    ? await db.pushSubscription.findMany({ where: { id: await subscriptionId(only.endpoint) } })
    : await db.pushSubscription.findMany();

  let sent = 0;
  let removed = 0;
  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload),
          { TTL: 60 * 60 * 6 }
        );
        sent++;
      } catch (error) {
        const status = (error as { statusCode?: number }).statusCode;
        // 404/410: the device unsubscribed or the subscription expired.
        if (status === 404 || status === 410) {
          await db.pushSubscription.deleteMany({ where: { id: sub.id } });
          removed++;
        }
      }
    })
  );
  return { sent, removed };
}
