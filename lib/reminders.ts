import "server-only";
import { db } from "@/lib/db";
import { daysUntil, todayKey } from "@/lib/dates";
import type { PushPayload } from "@/lib/push";

// The morning digest: what's due today and what's overdue. Nothing to say
// means no notification.
export async function morningDigest(): Promise<PushPayload | null> {
  const today = todayKey();
  const open = await db.task.findMany({
    where: { status: { not: "DONE" }, dueDate: { not: null } },
    select: { title: true, dueDate: true, priority: true },
    orderBy: { dueDate: "asc" }
  });
  const overdue = open.filter((task) => daysUntil(task.dueDate as Date, today) < 0);
  const dueToday = open.filter((task) => daysUntil(task.dueDate as Date, today) === 0);
  if (overdue.length === 0 && dueToday.length === 0) return null;

  const counts = [
    dueToday.length ? `${dueToday.length} due today` : "",
    overdue.length ? `${overdue.length} overdue` : ""
  ].filter(Boolean);
  const titles = [...dueToday, ...overdue].slice(0, 3).map((task) => `• ${task.title}`);
  const more = dueToday.length + overdue.length - titles.length;

  return {
    title: counts.join(" · "),
    body: [...titles, more > 0 ? `and ${more} more` : ""].filter(Boolean).join("\n"),
    url: "/review",
    tag: `digest-${today}`
  };
}
