import { expect, test, type Page, type Route } from "@playwright/test";
import { PASSCODE } from "../playwright.config";

// Face ID for actions, end to end with a simulated authenticator (Chromium's virtual
// WebAuthn device): register a passkey, press Approve, and check that the real server accepts
// the check and lets the request through to the bridge. The bridge is not configured in the
// test server, so a request that passes the Face ID gate ends as 503 (laptop offline), never
// as 403 step_up_required.

async function signIn(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Passcode").fill(PASSCODE);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

async function virtualFaceId(page: Page) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("WebAuthn.enable");
  await cdp.send("WebAuthn.addVirtualAuthenticator", {
    options: {
      protocol: "ctap2",
      transport: "internal",
      hasResidentKey: true,
      hasUserVerification: true,
      isUserVerified: true,
      automaticPresenceSimulation: true
    }
  });
}

const proposal = {
  proposal_id: "p-1", thread_id: "th-1", version: 1, status: "proposed", project_id: "jabx",
  employee_task: "cody.code_review", title: "Review the bridge", objective: "Check the signed client.",
  scope: ["lib/team-bridge.ts"], checks: ["npm test"], sources: [], budget_minutes: 30,
  created_at: "2026-10-09T10:00:00Z", decided_at: null, task_id: null
};
const thread = {
  thread_id: "th-1", kind: "adam", employee_id: null, project_id: null, task_id: null, title: "Adam",
  unread: 0, last_message_at: "2026-10-09T10:00:00Z", pending_reply: false
};
const team: Record<string, unknown> = {
  "/api/team/snapshot": {
    generated_at: "2026-10-09T10:00:00Z",
    projects: [{ project_id: "jabx", error: null, paused: false, last_event_at: null, event_count: 1, duplicates_ignored: 0, rejected_count: 0, rejected_lines: [] }],
    employees: [{ id: "adam", name: "Adam Carter", role: "Team Lead", photo: null }],
    tasks: []
  },
  "/api/team/attention": { items: [{ kind: "proposal", proposal }] },
  "/api/team/threads": { threads: [thread] },
  "/api/team/threads/th-1": {
    thread,
    messages: [{ message_id: "m-1", thread_id: "th-1", role: "adam", body: "Here is a plan.", created_at: "2026-10-09T10:00:00Z", proposal_id: "p-1", status: "sent" }],
    events: []
  },
  "/api/team/proposals/p-1": proposal,
  "/api/team/runner": { online: true, last_heartbeat_at: null }
};

// Reads come from a fixed team; the decision POST is left to the real server.
async function laptopReads(page: Page) {
  await page.route("**/api/team/**", async (route: Route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (request.method() === "POST" && path.endsWith("/decision")) return route.fallback();
    if (path === "/api/team/status") return route.fulfill({ json: { online: true, lastSeenAt: new Date().toISOString(), runnerOnline: true } });
    const body = team[path];
    return body ? route.fulfill({ json: body }) : route.fulfill({ status: 404, json: { error: "not_found" } });
  });
}

test.describe("Face ID for actions", () => {
  test("a passkey check lets Approve through; without one the server refuses", async ({ page }) => {
    await virtualFaceId(page);
    await signIn(page);

    // Add the passkey the way Jaber does: the prompt after sign-in.
    const prompt = page.getByRole("complementary").filter({ hasText: "Sign in with Face ID next time?" });
    await expect(prompt).toBeVisible();
    await prompt.getByRole("button", { name: "Set up" }).click();
    await expect(page.getByText("Passkey added")).toBeVisible();

    await laptopReads(page);
    await page.goto("/ai-team");
    await page.getByRole("region", { name: "Needs your attention" }).getByRole("button", { name: /Review the bridge/ }).click();
    const conversation = page.getByRole("dialog", { name: /Conversation/ });

    // Approve: Face ID runs (simulated), then the decision reaches the server.
    const decision = page.waitForResponse((response) => response.url().includes("/api/team/proposals/p-1/decision"));
    await conversation.getByRole("button", { name: "Approve" }).click();
    const response = await decision;
    expect(response.status(), "passed the Face ID gate and reached the (offline) bridge").toBe(503);

    // The proof is bound to this session and lasts 120 seconds. Without it the server says no.
    await page.context().clearCookies({ name: "jabx_step_up" });
    const refused = await page.evaluate(async () => {
      const r = await fetch("/api/team/proposals/p-1/decision", {
        method: "POST",
        headers: { "content-type": "application/json", origin: location.origin },
        body: JSON.stringify({ decision: "decline", version: 1, request_id: crypto.randomUUID() })
      });
      return { status: r.status, body: await r.json() };
    });
    expect(refused.status).toBe(403);
    expect(refused.body).toEqual({ error: "step_up_required" });
  });
});
