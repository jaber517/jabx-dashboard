import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DEFAULT_STAGE,
  FIXTURE_LEADS,
  STUDIO_STAGES,
  fetchStudioLeads,
  isLead,
  resolveLeadStage,
  validateLeadsResponse,
  type Lead
} from "../lib/studio-leads";

const SAMPLE_LEAD: Lead = {
  id: "lead-123",
  submitted_at: "2026-10-10T12:00:00.000Z",
  name: "Jane Doe",
  company: "Acme Corp",
  sector: "Technology",
  email: "jane@example.test",
  phone: "+1 555 123 4567",
  package: "Sprint",
  problem: "Need a new web portal",
  timing: "ASAP",
  email_status: "sent",
  email_sent_at: "2026-10-10T12:01:00.000Z"
};

test("isLead validates complete lead object", () => {
  assert.equal(isLead(SAMPLE_LEAD), true);

  // Phone can be null
  assert.equal(isLead({ ...SAMPLE_LEAD, phone: null }), true);

  // email_sent_at can be null
  assert.equal(isLead({ ...SAMPLE_LEAD, email_sent_at: null }), true);

  // Every valid email_status is accepted
  assert.equal(isLead({ ...SAMPLE_LEAD, email_status: "pending" }), true);
  assert.equal(isLead({ ...SAMPLE_LEAD, email_status: "failed" }), true);

  // Missing or invalid fields are rejected
  assert.equal(isLead(null), false);
  assert.equal(isLead({}), false);
  assert.equal(isLead({ ...SAMPLE_LEAD, id: "" }), false);
  assert.equal(isLead({ ...SAMPLE_LEAD, email_status: "delivered" }), false);
  assert.equal(isLead({ ...SAMPLE_LEAD, phone: 123 }), false);
  assert.equal(isLead({ ...SAMPLE_LEAD, email: null }), false);
});

test("validateLeadsResponse validates leads and nextCursor", () => {
  const valid = {
    leads: [SAMPLE_LEAD],
    nextCursor: "cursor-abc"
  };
  const parsed = validateLeadsResponse(valid);
  assert.ok(parsed);
  assert.equal(parsed?.leads.length, 1);
  assert.equal(parsed?.nextCursor, "cursor-abc");

  // nextCursor can be null
  const withNullCursor = validateLeadsResponse({
    leads: [SAMPLE_LEAD],
    nextCursor: null
  });
  assert.ok(withNullCursor);
  assert.equal(withNullCursor?.nextCursor, null);

  // Invalid structures return null
  assert.equal(validateLeadsResponse(null), null);
  assert.equal(validateLeadsResponse({ leads: "not-an-array" }), null);
  assert.equal(validateLeadsResponse({ leads: [{ id: "bad" }] }), null);
});

test("resolveLeadStage defaults to Lead received for missing, null, or invalid stages", () => {
  assert.equal(resolveLeadStage(undefined), "Lead received");
  assert.equal(resolveLeadStage(null), "Lead received");
  assert.equal(resolveLeadStage(""), "Lead received");
  assert.equal(resolveLeadStage("Unknown stage"), "Lead received");
  assert.equal(DEFAULT_STAGE, "Lead received");

  // Every declared stage resolves to itself
  for (const stage of STUDIO_STAGES) {
    assert.equal(resolveLeadStage(stage), stage);
  }
});

test("STUDIO_STAGES contains all 9 expected sales pipeline stages in order", () => {
  assert.deepEqual(STUDIO_STAGES, [
    "Lead received",
    "Discovery",
    "Estimate",
    "Approval",
    "Build",
    "Review and QA",
    "Delivery",
    "Follow-up",
    "Closed – not going ahead"
  ]);
});

test("fetchStudioLeads returns not connected when env vars are missing without fixtures", async () => {
  const prevUrl = process.env.LEADS_API_URL;
  const prevToken = process.env.LEADS_API_TOKEN;
  const prevFixtures = process.env.STUDIO_FIXTURES;
  delete process.env.LEADS_API_URL;
  delete process.env.LEADS_API_TOKEN;
  delete process.env.STUDIO_FIXTURES;

  try {
    const result = await fetchStudioLeads({ allowFixtures: false });
    assert.deepEqual(result, {
      ok: false,
      connected: false,
      reason: "LEADS_API_URL or LEADS_API_TOKEN is not configured."
    });
  } finally {
    if (prevUrl) process.env.LEADS_API_URL = prevUrl;
    if (prevToken) process.env.LEADS_API_TOKEN = prevToken;
    if (prevFixtures) process.env.STUDIO_FIXTURES = prevFixtures;
  }
});

test("fetchStudioLeads returns fixtures in development with STUDIO_FIXTURES=1", async () => {
  const prevNodeEnv = process.env.NODE_ENV;
  const prevFixtures = process.env.STUDIO_FIXTURES;
  const prevUrl = process.env.LEADS_API_URL;
  const prevToken = process.env.LEADS_API_TOKEN;

  delete process.env.LEADS_API_URL;
  delete process.env.LEADS_API_TOKEN;
  (process.env as Record<string, string>).NODE_ENV = "development";
  process.env.STUDIO_FIXTURES = "1";

  try {
    const result = await fetchStudioLeads();
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.connected, true);
      assert.equal(result.isFixture, true);
      assert.equal(result.leads.length, 4);
      assert.equal(result.nextCursor, null);
      for (const lead of result.leads) {
        assert.ok(lead.email.endsWith("@example.test"));
      }
    }
  } finally {
    (process.env as Record<string, string>).NODE_ENV = prevNodeEnv;
    if (prevFixtures) process.env.STUDIO_FIXTURES = prevFixtures;
    else delete process.env.STUDIO_FIXTURES;
    if (prevUrl) process.env.LEADS_API_URL = prevUrl;
    if (prevToken) process.env.LEADS_API_TOKEN = prevToken;
  }
});

test("fetchStudioLeads ignores STUDIO_FIXTURES in production", async () => {
  const prevNodeEnv = process.env.NODE_ENV;
  const prevFixtures = process.env.STUDIO_FIXTURES;
  const prevUrl = process.env.LEADS_API_URL;
  const prevToken = process.env.LEADS_API_TOKEN;

  delete process.env.LEADS_API_URL;
  delete process.env.LEADS_API_TOKEN;
  (process.env as Record<string, string>).NODE_ENV = "production";
  process.env.STUDIO_FIXTURES = "1";

  try {
    const result = await fetchStudioLeads();
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.connected, false);
    }
  } finally {
    (process.env as Record<string, string>).NODE_ENV = prevNodeEnv;
    if (prevFixtures) process.env.STUDIO_FIXTURES = prevFixtures;
    else delete process.env.STUDIO_FIXTURES;
    if (prevUrl) process.env.LEADS_API_URL = prevUrl;
    if (prevToken) process.env.LEADS_API_TOKEN = prevToken;
  }
});

test("fetchStudioLeads fetches upstream with Bearer auth and validates response", async () => {
  let capturedUrl = "";
  let capturedAuthHeader = "";

  const mockFetch: typeof fetch = async (input, init) => {
    capturedUrl = String(input);
    capturedAuthHeader = (init?.headers as Record<string, string>)?.Authorization ?? "";
    return new Response(
      JSON.stringify({
        leads: [SAMPLE_LEAD],
        nextCursor: "cursor-123"
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  };

  const result = await fetchStudioLeads({
    config: { apiUrl: "https://leads.test", apiToken: "secret-token-xyz" },
    fetchImpl: mockFetch
  });

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.connected, true);
    assert.equal(result.leads.length, 1);
    assert.equal(result.leads[0].id, SAMPLE_LEAD.id);
    assert.equal(result.nextCursor, "cursor-123");
  }
  assert.equal(capturedUrl, "https://leads.test/api/leads?limit=25");
  assert.equal(capturedAuthHeader, "Bearer secret-token-xyz");
});

test("fetchStudioLeads handles upstream HTTP errors and timeouts", async () => {
  const errorFetch: typeof fetch = async () =>
    new Response("Unauthorized", { status: 401 });

  const result = await fetchStudioLeads({
    config: { apiUrl: "https://leads.test", apiToken: "bad-token" },
    fetchImpl: errorFetch
  });

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.connected, true);
    assert.match(result.error ?? "", /401/);
  }

  const timeoutFetch: typeof fetch = async (_input, init) =>
    new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () =>
        reject(new DOMException("Aborted", "AbortError"))
      );
    });

  const timeoutResult = await fetchStudioLeads({
    config: { apiUrl: "https://leads.test", apiToken: "token" },
    fetchImpl: timeoutFetch,
    timeoutMs: 30
  });

  assert.equal(timeoutResult.ok, false);
  if (!timeoutResult.ok) {
    assert.equal(timeoutResult.connected, true);
    assert.match(timeoutResult.error ?? "", /timed out|Network error/);
  }
});
