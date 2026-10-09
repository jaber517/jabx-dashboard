"use client";

import { useEffect, useSyncExternalStore } from "react";
import type { TeamStatus } from "./types";

// Whether the laptop that runs the AI team is reachable. Shared by the nav's status dot
// and the AI Team tab: GET /api/team/status every 60 s in the background, and every
// /api/team call reports what it learned (a 503 means offline, a good answer online).

export type Presence = { online: boolean | null; lastSeenAt: string | null };

const STATUS_POLL_MS = 60_000;

let state: Presence = { online: null, lastSeenAt: null };
const listeners = new Set<() => void>();

function set(next: Presence) {
  if (next.online === state.online && next.lastSeenAt === state.lastSeenAt) return;
  state = next;
  for (const listener of Array.from(listeners)) listener();
}

export function reportOnline(lastSeenAt: string | null = new Date().toISOString()) {
  set({ online: true, lastSeenAt });
}

export function reportOffline(lastSeenAt: string | null) {
  set({ online: false, lastSeenAt: lastSeenAt ?? state.lastSeenAt });
}

export function isTeamStatus(value: unknown): value is TeamStatus {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return typeof record.online === "boolean" && (record.lastSeenAt === null || typeof record.lastSeenAt === "string");
}

export async function checkTeamStatus(): Promise<void> {
  try {
    const response = await fetch("/api/team/status", { cache: "no-store", credentials: "same-origin" });
    const body: unknown = await response.json().catch(() => null);
    if (!response.ok || !isTeamStatus(body)) return;
    if (body.online) reportOnline(body.lastSeenAt);
    else reportOffline(body.lastSeenAt);
  } catch {
    // dash itself is unreachable (no signal); keep what we knew.
  }
}

let subscribers = 0;
let timer: ReturnType<typeof setInterval> | undefined;

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** The laptop's presence; the first user starts the 60-second background check. */
export function useTeamPresence(): Presence {
  useEffect(() => {
    subscribers += 1;
    if (subscribers === 1) {
      void checkTeamStatus();
      timer = setInterval(() => void checkTeamStatus(), STATUS_POLL_MS);
    }
    return () => {
      subscribers -= 1;
      if (subscribers === 0) clearInterval(timer);
    };
  }, []);
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => state
  );
}
