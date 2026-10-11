import "server-only";

import { db } from "@/lib/db";
import {
  STUDIO_STAGES,
  fetchStudioLeads,
  resolveLeadStage,
  type Lead
} from "@/lib/studio-leads";

const MAX_DELETIONS = 200;
const PAGE_SIZE = 100;
const DELETE_CONCURRENCY = 20;
const REQUEST_TIMEOUT_MS = 5_000;
const RETENTION_MS = 365 * 24 * 60 * 60 * 1_000;

// Approval through Follow-up are the durable project stages. Keeping this
// derived from STUDIO_STAGES makes the retention rule follow the pipeline's
// canonical stage names.
const PROJECT_STAGES = new Set(STUDIO_STAGES.slice(3, -1));

export type StudioCleanupResult = {
  checked: number;
  deleted: number;
  failed: number;
};

type StageRow = { leadId: string; stage: string };

export type StudioCleanupStageStore = {
  findMany(leadIds: string[]): Promise<StageRow[]>;
  delete(leadId: string): Promise<void>;
};

export type StudioCleanupOptions = {
  now?: Date | number;
  config?: { apiUrl: string; apiToken: string };
  fetchImpl?: typeof fetch;
  stageStore?: StudioCleanupStageStore;
  timeoutMs?: number;
};

const defaultStageStore: StudioCleanupStageStore = {
  async findMany(leadIds) {
    const rows = await db.leadStage.findMany({
      where: { leadId: { in: leadIds } },
      select: { leadId: true, stage: true }
    });
    return rows;
  },
  async delete(leadId) {
    await db.leadStage.deleteMany({ where: { leadId } });
  }
};

async function loadStages(
  leadIds: string[],
  stageStore: StudioCleanupStageStore
): Promise<Map<string, string>> {
  const stages = new Map<string, string>();

  // Stay below SQLite's bind-variable limit even if the Worker has many leads.
  for (let start = 0; start < leadIds.length; start += 500) {
    const rows = await stageStore.findMany(leadIds.slice(start, start + 500));
    for (const row of rows) stages.set(row.leadId, row.stage);
  }

  return stages;
}

async function deleteLead(
  lead: Lead,
  apiUrl: string,
  apiToken: string,
  fetchImpl: typeof fetch,
  stageStore: StudioCleanupStageStore,
  timeoutMs: number
): Promise<boolean> {
  let url: URL;
  try {
    url = new URL(`/api/leads/${encodeURIComponent(lead.id)}`, apiUrl);
  } catch {
    return false;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(url.toString(), {
      method: "DELETE",
      headers: { Authorization: `Bearer ${apiToken}` },
      cache: "no-store",
      signal: controller.signal
    });
    if (response.status !== 204) return false;

    await stageStore.delete(lead.id);
    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export async function cleanupStudioLeads(
  options: StudioCleanupOptions = {}
): Promise<StudioCleanupResult> {
  const result: StudioCleanupResult = { checked: 0, deleted: 0, failed: 0 };
  const apiUrl = options.config?.apiUrl ?? process.env.LEADS_API_URL;
  const apiToken = options.config?.apiToken ?? process.env.LEADS_API_TOKEN;

  // Lead storage is optional in local and preview environments.
  if (!apiUrl || !apiToken) return result;

  try {
    const leads: Lead[] = [];
    const seenCursors = new Set<string>();
    let cursor: string | undefined;

    while (true) {
      const page = await fetchStudioLeads({
        cursor,
        limit: PAGE_SIZE,
        config: { apiUrl, apiToken },
        fetchImpl: options.fetchImpl,
        allowFixtures: false,
        timeoutMs: options.timeoutMs ?? REQUEST_TIMEOUT_MS
      });

      if (!page.ok) {
        result.failed += 1;
        return result;
      }

      leads.push(...page.leads);
      result.checked += page.leads.length;

      if (!page.nextCursor) break;
      if (seenCursors.has(page.nextCursor)) {
        result.failed += 1;
        return result;
      }
      seenCursors.add(page.nextCursor);
      cursor = page.nextCursor;
    }

    const stageStore = options.stageStore ?? defaultStageStore;
    const stages = await loadStages(
      leads.map((lead) => lead.id),
      stageStore
    );
    const now = options.now instanceof Date ? options.now.getTime() : options.now ?? Date.now();
    const cutoff = now - RETENTION_MS;
    const candidates = leads
      .filter((lead) => {
        const submittedAt = Date.parse(lead.submitted_at);
        const stage = resolveLeadStage(stages.get(lead.id));
        return Number.isFinite(submittedAt) && submittedAt < cutoff && !PROJECT_STAGES.has(stage);
      })
      .slice(0, MAX_DELETIONS);

    const fetchImpl = options.fetchImpl ?? fetch;
    for (let start = 0; start < candidates.length; start += DELETE_CONCURRENCY) {
      const outcomes = await Promise.all(
        candidates
          .slice(start, start + DELETE_CONCURRENCY)
          .map((lead) =>
            deleteLead(
              lead,
              apiUrl,
              apiToken,
              fetchImpl,
              stageStore,
              options.timeoutMs ?? REQUEST_TIMEOUT_MS
            )
          )
      );
      for (const deleted of outcomes) {
        if (deleted) result.deleted += 1;
        else result.failed += 1;
      }
    }
  } catch {
    result.failed += 1;
  }

  return result;
}
