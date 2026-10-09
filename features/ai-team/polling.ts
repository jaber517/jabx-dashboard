// How often the AI Team tab asks the laptop for news. Every 5 s while the tab is visible
// and a thread or run is open or pending, every 15 s otherwise, every 60 s while the
// page is hidden; failed loads back off. Loads never overlap and a stale answer is dropped.

export const FAST_MS = 5_000;
export const SLOW_MS = 15_000;
export const HIDDEN_MS = 60_000;
export const MAX_BACKOFF_MS = 60_000;

export type Timers = { setTimeout: (fn: () => void, ms: number) => unknown; clearTimeout: (handle: unknown) => void };
export const realTimers: Timers = {
  setTimeout: (fn, ms) => globalThis.setTimeout(fn, ms),
  clearTimeout: (handle) => globalThis.clearTimeout(handle as ReturnType<typeof setTimeout>)
};

// Delay before the next try after `failures` failed loads in a row: doubles, capped.
export const backoffMs = (baseMs: number, failures: number, maxMs = MAX_BACKOFF_MS) =>
  failures <= 0 ? baseMs : Math.min(Math.max(maxMs, baseMs), baseMs * 2 ** failures);

export function pollDelay({ visible, active, failures = 0 }: { visible: boolean; active: boolean; failures?: number }) {
  const base = !visible ? HIDDEN_MS : active ? FAST_MS : SLOW_MS;
  return backoffMs(base, failures);
}

export function isPageVisible() {
  return typeof document === "undefined" || document.visibilityState !== "hidden";
}

// Hands out tickets for loads; only the newest ticket's answer may be applied.
export function latestOnly() {
  let newest = 0;
  return {
    begin() {
      const ticket = ++newest;
      return () => ticket === newest;
    },
    invalidate() {
      newest += 1;
    }
  };
}

// Runs one task at a time. A call while one is running waits for it and then runs once more
// (so a refresh asked for after a send sees the send); any further calls share that rerun.
export function coalesce<T>(task: () => Promise<T>): () => Promise<T> {
  let running: Promise<T> | null = null;
  let queued: Promise<T> | null = null;
  const run = (): Promise<T> => {
    const current = task().finally(() => {
      if (running === current) running = null;
    });
    running = current;
    return current;
  };
  return () => {
    if (!running) return run();
    if (!queued) {
      queued = running
        .catch(() => undefined)
        .then(() => {
          queued = null;
          return run();
        });
    }
    return queued;
  };
}

// A self-scheduling poller. `load` throws on failure; `delay(failures)` picks the next wait.
// poke() loads now (after any load in flight) and restarts the schedule.
export function createPoller({
  load,
  delay,
  timers = realTimers
}: {
  load: () => Promise<void>;
  delay: (failures: number) => number;
  timers?: Timers;
}) {
  let live = false;
  let handle: unknown;
  let failures = 0;

  const once = coalesce(async () => {
    try {
      await load();
      failures = 0;
    } catch {
      failures += 1;
    }
  });

  async function tick() {
    if (!live) return;
    timers.clearTimeout(handle);
    await once();
    if (!live) return;
    timers.clearTimeout(handle);
    handle = timers.setTimeout(() => void tick(), delay(failures));
  }

  return {
    failures: () => failures,
    start() {
      if (live) return Promise.resolve();
      live = true;
      return tick();
    },
    poke: () => tick(),
    stop() {
      live = false;
      timers.clearTimeout(handle);
    }
  };
}
