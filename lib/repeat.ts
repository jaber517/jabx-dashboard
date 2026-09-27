import { addDays } from "@/lib/dates";

// How a task repeats. Completing a repeating task creates its next
// occurrence with the next due date after today.
export const REPEAT_OPTIONS = ["", "DAILY", "WEEKDAYS", "WEEKLY", "MONTHLY", "YEARLY"] as const;
export type Repeat = (typeof REPEAT_OPTIONS)[number];

export const repeatLabels: Record<Repeat, string> = {
  "": "Doesn't repeat",
  DAILY: "Every day",
  WEEKDAYS: "Every weekday (Sun–Thu)",
  WEEKLY: "Every week",
  MONTHLY: "Every month",
  YEARLY: "Every year"
};

export const repeatShortLabels: Record<Repeat, string> = {
  "": "",
  DAILY: "Daily",
  WEEKDAYS: "Weekdays",
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
  YEARLY: "Yearly"
};

export function asRepeat(value: unknown): Repeat {
  return (REPEAT_OPTIONS as readonly unknown[]).includes(value) ? (value as Repeat) : "";
}

function parts(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  return { y, m, d };
}

function key(y: number, m: number, d: number) {
  // Clamp to the month's last day (31 Jan + 1 month = 28/29 Feb).
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return new Date(Date.UTC(y, m - 1, Math.min(d, last))).toISOString().slice(0, 10);
}

// Kuwait's working week is Sunday to Thursday.
function isWeekday(dayKey: string) {
  const day = new Date(`${dayKey}T00:00:00Z`).getUTCDay();
  return day >= 0 && day <= 4;
}

/** One step of the rule from `from` (a "YYYY-MM-DD" key). */
function step(from: string, repeat: Exclude<Repeat, "">, anchorDay: number): string {
  const { y, m } = parts(from);
  switch (repeat) {
    case "DAILY":
      return addDays(from, 1);
    case "WEEKDAYS": {
      let next = addDays(from, 1);
      while (!isWeekday(next)) next = addDays(next, 1);
      return next;
    }
    case "WEEKLY":
      return addDays(from, 7);
    case "MONTHLY":
      return m === 12 ? key(y + 1, 1, anchorDay) : key(y, m + 1, anchorDay);
    case "YEARLY":
      return key(y + 1, m, anchorDay);
  }
}

/**
 * The next due date for a repeating task completed today: step from its due
 * date (or today if it had none) until the date is after today, so a task
 * completed late doesn't create a string of already-overdue copies.
 * Monthly and yearly keep the original day of the month where it exists.
 */
export function nextDueDate(repeat: Repeat, dueKey: string | null, today: string): string | null {
  if (!repeat) return null;
  const start = dueKey ?? today;
  const anchorDay = parts(start).d;
  let next = step(start, repeat, anchorDay);
  while (next <= today) next = step(next, repeat, anchorDay);
  return next;
}
