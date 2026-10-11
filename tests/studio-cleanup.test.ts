import assert from "node:assert/strict";
import { test } from "node:test";
import {
  cleanupStudioLeads,
  type StudioCleanupStageStore
} from "../lib/studio-cleanup";
import { STUDIO_STAGES, type Lead } from "../lib/studio-leads";

const NOW = new Date("2026-10-11T00:00:00.000Z");
const CUTOFF = new Date(NOW.getTime() - 365 * 24 * 60 * 60 * 1_000);
const CONFIG = { apiUrl: "https://leads.test", apiToken: "secret-token" };

function lead(id: string, submittedAt: Date): Lead {
  return {
    id,
    submitted_at: submittedAt.toISOString(),
    name: `Lead ${id}`,
    company: "Example",
    sector: "Technology",
    email: `${id}@example.test`,
    phone: null,
    package: "Sprint",
    problem: "Example problem",
    timing: "Flexible",
    email_status: "sent",
    email_sent_at: null
  };
}

function stageStore(
  stages: Map<string, string>,
  removed: string[] = []
): StudioCleanupStageStore {
  return {
    async findMany(leadIds) {
      return leadIds.flatMap((leadId) => {
        const stage = stages.get(leadId);
        return stage === undefined ? [] : [{ leadId, stage }];
      });
    },
    async delete(leadId) {
      removed.push(leadId);
    }
  };
}

test("cleanup applies every stage rule and keeps the exact 365-day boundary", async () => {
  const old = new Date(CUTOFF.getTime() - 1);
  const leads = STUDIO_STAGES.map((_, index) => lead(`stage-${index}`, old));
  leads.push(lead("missing-stage", old));
  leads.push(lead("at-boundary", CUTOFF));
  leads.push(lead("new-lead", new Date(CUTOFF.getTime() + 1)));

  const stages = new Map(STUDIO_STAGES.map((stage, index) => [`stage-${index}`, stage]));
  const deleted: string[] = [];
  const removed: string[] = [];
  const fakeFetch: typeof fetch = async (input, init) => {
    if (init?.method === "DELETE") {
      deleted.push(new URL(String(input)).pathname.split("/").at(-1) ?? "");
      return new Response(null, { status: 204 });
    }
    return Response.json({ leads, nextCursor: null });
  };

  const result = await cleanupStudioLeads({
    now: NOW,
    config: CONFIG,
    fetchImpl: fakeFetch,
    stageStore: stageStore(stages, removed)
  });

  assert.deepEqual(result, { checked: 12, deleted: 5, failed: 0 });
  assert.deepEqual(deleted.sort(), [
    "missing-stage",
    "stage-0",
    "stage-1",
    "stage-2",
    "stage-8"
  ]);
  assert.deepEqual(removed.sort(), deleted);
});

test("cleanup follows pagination before deleting eligible leads", async () => {
  const old = new Date(CUTOFF.getTime() - 1);
  const requestedUrls: string[] = [];
  const deleted: string[] = [];
  const fakeFetch: typeof fetch = async (input, init) => {
    const url = new URL(String(input));
    if (init?.method === "DELETE") {
      deleted.push(url.pathname);
      return new Response(null, { status: 204 });
    }

    requestedUrls.push(url.toString());
    if (!url.searchParams.has("cursor")) {
      return Response.json({ leads: [lead("page-1", old)], nextCursor: "next page" });
    }
    return Response.json({ leads: [lead("page-2", old)], nextCursor: null });
  };

  const result = await cleanupStudioLeads({
    now: NOW,
    config: CONFIG,
    fetchImpl: fakeFetch,
    stageStore: stageStore(new Map())
  });

  assert.deepEqual(result, { checked: 2, deleted: 2, failed: 0 });
  assert.equal(requestedUrls.length, 2);
  assert.equal(new URL(requestedUrls[1]).searchParams.get("cursor"), "next page");
  assert.deepEqual(deleted.sort(), ["/api/leads/page-1", "/api/leads/page-2"]);
});

test("cleanup continues after individual delete failures", async () => {
  const old = new Date(CUTOFF.getTime() - 1);
  const removed: string[] = [];
  const fakeFetch: typeof fetch = async (input, init) => {
    if (init?.method !== "DELETE") {
      return Response.json({
        leads: [lead("success", old), lead("http-failure", old), lead("network-failure", old)],
        nextCursor: null
      });
    }

    const id = new URL(String(input)).pathname.split("/").at(-1);
    if (id === "success") return new Response(null, { status: 204 });
    if (id === "http-failure") return new Response(null, { status: 500 });
    throw new Error("network unavailable");
  };

  const result = await cleanupStudioLeads({
    now: NOW,
    config: CONFIG,
    fetchImpl: fakeFetch,
    stageStore: stageStore(new Map(), removed)
  });

  assert.deepEqual(result, { checked: 3, deleted: 1, failed: 2 });
  assert.deepEqual(removed, ["success"]);
});

test("cleanup caps each run at 200 delete attempts", async () => {
  const old = new Date(CUTOFF.getTime() - 1);
  const leads = Array.from({ length: 205 }, (_, index) => lead(`old-${index}`, old));
  let deleteCalls = 0;
  const fakeFetch: typeof fetch = async (_input, init) => {
    if (init?.method === "DELETE") {
      deleteCalls += 1;
      return new Response(null, { status: 204 });
    }
    return Response.json({ leads, nextCursor: null });
  };

  const result = await cleanupStudioLeads({
    now: NOW,
    config: CONFIG,
    fetchImpl: fakeFetch,
    stageStore: stageStore(new Map())
  });

  assert.deepEqual(result, { checked: 205, deleted: 200, failed: 0 });
  assert.equal(deleteCalls, 200);
});

test("cleanup skips quietly when lead API configuration is missing", async () => {
  const previousUrl = process.env.LEADS_API_URL;
  const previousToken = process.env.LEADS_API_TOKEN;
  delete process.env.LEADS_API_URL;
  delete process.env.LEADS_API_TOKEN;
  let fetched = false;

  try {
    const result = await cleanupStudioLeads({
      fetchImpl: async () => {
        fetched = true;
        throw new Error("should not fetch");
      }
    });
    assert.deepEqual(result, { checked: 0, deleted: 0, failed: 0 });
    assert.equal(fetched, false);
  } finally {
    if (previousUrl === undefined) delete process.env.LEADS_API_URL;
    else process.env.LEADS_API_URL = previousUrl;
    if (previousToken === undefined) delete process.env.LEADS_API_TOKEN;
    else process.env.LEADS_API_TOKEN = previousToken;
  }
});

test("cleanup reports storage failures instead of throwing", async () => {
  const old = new Date(CUTOFF.getTime() - 1);
  const result = await cleanupStudioLeads({
    now: NOW,
    config: CONFIG,
    fetchImpl: async () => Response.json({ leads: [lead("old", old)], nextCursor: null }),
    stageStore: {
      async findMany() {
        throw new Error("database unavailable");
      },
      async delete() {}
    }
  });

  assert.deepEqual(result, { checked: 1, deleted: 0, failed: 1 });
});
