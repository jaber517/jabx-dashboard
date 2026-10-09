const SEGMENT = /^[A-Za-z0-9._-]+$/;

export type TeamRoutePolicy = {
  remotePath: string;
  requiresStepUp: boolean;
};

function validSegment(segment: string): boolean {
  return segment !== "." && segment !== ".." && SEGMENT.test(segment);
}

function matches(segments: string[], pattern: readonly (string | ":id")[]): boolean {
  return segments.length === pattern.length && pattern.every((part, index) => part === ":id" || part === segments[index]);
}

function allowedQueryKeys(method: string, segments: string[]): ReadonlySet<string> {
  if (method === "GET" && matches(segments, ["threads", ":id"])) return new Set(["after"]);
  if (method === "GET" && matches(segments, ["runs"])) return new Set(["project_id", "task_id"]);
  return new Set();
}

const GET_PATTERNS = [
  ["snapshot"],
  ["attention"],
  ["threads"],
  ["threads", ":id"],
  ["proposals", ":id"],
  ["proposals", ":id", "eligibility"],
  ["runs"],
  ["runs", ":id"],
  ["runner"],
  ["health"]
] as const;

const POST_PATTERNS = [
  ["threads", "open"],
  ["threads", ":id", "messages"],
  ["proposals", ":id", "decision"],
  ["proposals", ":id", "start"],
  ["runs", ":id", "cancel"]
] as const;

const STEP_UP_PATTERNS = [
  ["proposals", ":id", "decision"],
  ["proposals", ":id", "start"],
  ["runs", ":id", "cancel"]
] as const;

/** Validates and maps a browser-facing /api/team path to the laptop's /api path. */
export function resolveTeamRoute(method: string, segments: string[], rawSearch = ""): TeamRoutePolicy | null {
  if (!segments.length || !segments.every(validSegment)) return null;
  const patterns = method === "GET" ? GET_PATTERNS : method === "POST" ? POST_PATTERNS : [];
  if (!patterns.some((pattern) => matches(segments, pattern))) return null;

  const params = new URLSearchParams(rawSearch.startsWith("?") ? rawSearch.slice(1) : rawSearch);
  const allowed = allowedQueryKeys(method, segments);
  const seen = new Set<string>();
  for (const [key, value] of params) {
    if (!allowed.has(key) || seen.has(key) || (value !== "" && !validSegment(value))) return null;
    seen.add(key);
  }

  const query = rawSearch && rawSearch !== "?" ? (rawSearch.startsWith("?") ? rawSearch : `?${rawSearch}`) : "";
  return {
    remotePath: `/api/${segments.join("/")}${query}`,
    requiresStepUp: method === "POST" && STEP_UP_PATTERNS.some((pattern) => matches(segments, pattern))
  };
}

/**
 * CSRF check for POSTs: the browser's Origin must be exactly this site's host. Compared with
 * the Host the request arrived on (x-forwarded-host first, as set by Vercel), not request.url,
 * which behind a rewrite or a local server can name an internal host.
 */
export function isSameOrigin(origin: string | null, host: string | null, forwardedHost: string | null = null): boolean {
  const expected = (forwardedHost?.split(",")[0] || host || "").trim().toLowerCase();
  if (!origin || !expected) return false;
  try {
    const parsed = new URL(origin);
    return (parsed.protocol === "https:" || parsed.protocol === "http:") && parsed.host.toLowerCase() === expected;
  } catch {
    return false;
  }
}
