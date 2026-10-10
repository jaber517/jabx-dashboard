import "server-only";

import { db } from "@/lib/db";
import {
  DEFAULT_STAGE,
  STUDIO_STAGES,
  resolveLeadStage,
  type EmailStatus,
  type Lead,
  type LeadWithStage,
  type StudioStage
} from "@/features/studio/types";

export {
  DEFAULT_STAGE,
  STUDIO_STAGES,
  resolveLeadStage,
  type EmailStatus,
  type Lead,
  type LeadWithStage,
  type StudioStage
};

export const FIXTURE_LEADS: Lead[] = [
  {
    id: "lead-fixture-1",
    submitted_at: "2026-10-09T14:30:00.000Z",
    name: "Sarah Chen",
    company: "Apex Meridian",
    sector: "Fintech",
    email: "sarah.chen@example.test",
    phone: "+44 20 7946 0912",
    package: "Sprint",
    problem: "Need a high-converting onboarding dashboard for institutional clients.",
    timing: "Next 2 weeks",
    email_status: "sent",
    email_sent_at: "2026-10-09T14:30:05.000Z"
  },
  {
    id: "lead-fixture-2",
    submitted_at: "2026-10-08T11:15:00.000Z",
    name: "Marcus Vance",
    company: "Vance Logistics",
    sector: "Supply Chain",
    email: "marcus@example.test",
    phone: "+44 7700 900123",
    package: "Custom System",
    problem: "Our legacy dispatch tracker is slowing down warehouse operations.",
    timing: "Next month",
    email_status: "failed",
    email_sent_at: null
  },
  {
    id: "lead-fixture-3",
    submitted_at: "2026-10-07T09:00:00.000Z",
    name: "Elena Rostova",
    company: "Klarity Health",
    sector: "Healthcare",
    email: "elena.rostova@example.test",
    phone: null,
    package: "Advisory",
    problem: "Architecture audit and roadmap for our patient data portal.",
    timing: "Flexible",
    email_status: "sent",
    email_sent_at: "2026-10-07T09:00:10.000Z"
  },
  {
    id: "lead-fixture-4",
    submitted_at: "2026-10-06T16:45:00.000Z",
    name: "Tariq Al-Mansoor",
    company: "Oasis Ventures",
    sector: "Real Estate",
    email: "tariq@example.test",
    phone: "+965 2200 1122",
    package: "Sprint",
    problem: "Client portal for property investors with live construction updates.",
    timing: "Immediately",
    email_status: "pending",
    email_sent_at: null
  }
];

export function isLead(val: unknown): val is Lead {
  if (!val || typeof val !== "object") return false;
  const o = val as Record<string, unknown>;
  if (typeof o.id !== "string" || !o.id) return false;
  if (typeof o.submitted_at !== "string") return false;
  if (typeof o.name !== "string") return false;
  if (typeof o.company !== "string") return false;
  if (typeof o.sector !== "string") return false;
  if (typeof o.email !== "string") return false;
  if (o.phone !== null && typeof o.phone !== "string") return false;
  if (typeof o.package !== "string") return false;
  if (typeof o.problem !== "string") return false;
  if (typeof o.timing !== "string") return false;
  if (o.email_status !== "pending" && o.email_status !== "sent" && o.email_status !== "failed") return false;
  if (o.email_sent_at !== null && typeof o.email_sent_at !== "string") return false;
  return true;
}

export function validateLeadsResponse(json: unknown): { leads: Lead[]; nextCursor: string | null } | null {
  if (!json || typeof json !== "object") return null;
  const o = json as Record<string, unknown>;
  if (!Array.isArray(o.leads)) return null;
  for (const item of o.leads) {
    if (!isLead(item)) return null;
  }
  const nextCursor = o.nextCursor === null || typeof o.nextCursor === "string" ? o.nextCursor : null;
  return { leads: o.leads, nextCursor };
}

export type FetchStudioLeadsResult =
  | { ok: true; connected: true; leads: Lead[]; nextCursor: string | null; isFixture?: boolean }
  | { ok: false; connected: false; reason: string }
  | { ok: false; connected: true; error: string };

export type FetchStudioLeadsOptions = {
  cursor?: string;
  limit?: number;
  config?: { apiUrl: string; apiToken: string };
  fetchImpl?: typeof fetch;
  allowFixtures?: boolean;
  timeoutMs?: number;
};

export async function fetchStudioLeads(
  options: FetchStudioLeadsOptions = {}
): Promise<FetchStudioLeadsResult> {
  const apiUrl = options.config?.apiUrl ?? process.env.LEADS_API_URL;
  const apiToken = options.config?.apiToken ?? process.env.LEADS_API_TOKEN;

  if (!apiUrl || !apiToken) {
    const isDev = process.env.NODE_ENV === "development";
    const fixturesEnabled = process.env.STUDIO_FIXTURES === "1";
    if (options.allowFixtures !== false && isDev && fixturesEnabled) {
      return {
        ok: true,
        connected: true,
        leads: FIXTURE_LEADS,
        nextCursor: null,
        isFixture: true
      };
    }
    return {
      ok: false,
      connected: false,
      reason: "LEADS_API_URL or LEADS_API_TOKEN is not configured."
    };
  }

  let url: URL;
  try {
    url = new URL("/api/leads", apiUrl);
    const limit = options.limit ?? 25;
    url.searchParams.set("limit", String(limit));
    if (options.cursor) {
      url.searchParams.set("cursor", options.cursor);
    }
  } catch {
    return { ok: false, connected: true, error: "Invalid LEADS_API_URL." };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? 5_000);
  try {
    const fetchFn = options.fetchImpl ?? fetch;
    const response = await fetchFn(url.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        Accept: "application/json"
      },
      cache: "no-store",
      signal: controller.signal
    });

    if (!response.ok) {
      return {
        ok: false,
        connected: true,
        error: `Leads API returned HTTP ${response.status}.`
      };
    }

    const text = await response.text();
    let json: unknown;
    try {
      json = text === "" ? null : JSON.parse(text);
    } catch {
      return {
        ok: false,
        connected: true,
        error: "Upstream returned invalid JSON."
      };
    }

    const validated = validateLeadsResponse(json);
    if (!validated) {
      return {
        ok: false,
        connected: true,
        error: "Upstream returned an invalid payload structure."
      };
    }

    return {
      ok: true,
      connected: true,
      leads: validated.leads,
      nextCursor: validated.nextCursor
    };
  } catch {
    return {
      ok: false,
      connected: true,
      error: controller.signal.aborted ? "Leads API request timed out." : "Network error contacting Leads API."
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function getLeadsWithStages(leads: Lead[]): Promise<LeadWithStage[]> {
  if (leads.length === 0) return [];
  const leadIds = leads.map((l) => l.id);
  const rows = await db.leadStage.findMany({
    where: { leadId: { in: leadIds } }
  });
  const rowMap = new Map(rows.map((r) => [r.leadId, r]));

  return leads.map((lead) => {
    const row = rowMap.get(lead.id);
    return {
      ...lead,
      stage: resolveLeadStage(row?.stage),
      note: row?.note ?? null,
      stageUpdatedAt: row?.updatedAt ?? null
    };
  });
}
