// Calendar-day helpers that give the same answer on the server (UTC on
// Vercel) and in the browser.
//
// Due dates come from <input type="date"> and are stored as midnight UTC, so a
// due date's calendar day is its UTC date. "Today" is the date in the owner's
// time zone. Comparing the two as YYYY-MM-DD keys avoids the evening window
// where the server (UTC) and Kuwait (UTC+3) disagree about what day it is.

export const TIME_ZONE = process.env.NEXT_PUBLIC_TIME_ZONE || "Asia/Kuwait";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** A stored date's calendar day, "YYYY-MM-DD" (UTC). */
export function dayKey(value: string | Date): string {
  return (typeof value === "string" ? new Date(value) : value).toISOString().slice(0, 10);
}

/** Today in the owner's time zone, "YYYY-MM-DD". */
export function todayKey(now: Date = new Date()): string {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

function keyToUtc(key: string): number {
  const [y, m, d] = key.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

/** Whole days from `from` to `to` (both keys); negative when `to` is earlier. */
export function daysBetween(from: string, to: string): number {
  return Math.round((keyToUtc(to) - keyToUtc(from)) / 86_400_000);
}

/** Days from today until a stored date: 0 = today, 1 = tomorrow, -1 = yesterday. */
export function daysUntil(value: string | Date, today: string = todayKey()): number {
  return daysBetween(today, dayKey(value));
}

/** The key `days` after `key`. */
export function addDays(key: string, days: number): string {
  return new Date(keyToUtc(key) + days * 86_400_000).toISOString().slice(0, 10);
}

export function weekdayOf(key: string): string {
  return WEEKDAYS[new Date(keyToUtc(key)).getUTCDay()];
}

/** "3 Oct", with the year only when it isn't this year. */
export function shortDate(key: string, today: string = todayKey()): string {
  const [y, m, d] = key.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]}${key.slice(0, 4) === today.slice(0, 4) ? "" : ` ${y}`}`;
}

/** "Today", "Tomorrow", "Yesterday", "Mon" within the week, else "3 Oct". */
export function relativeDay(value: string | Date, today: string = todayKey()): string {
  const key = dayKey(value);
  const days = daysBetween(today, key);
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days === -1) return "Yesterday";
  if (days > 1 && days < 7) return weekdayOf(key);
  return shortDate(key, today);
}
