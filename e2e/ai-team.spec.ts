import { expect, test, type Page, type Route } from "@playwright/test";
import { PASSCODE } from "../playwright.config";

// The AI Team tab. The laptop is never reachable from the test server, so every
// /api/team call is answered in the browser by page.route: either the 503 dash sends when
// the MacBook is offline, or a small fixed team.

async function signIn(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Passcode").fill(PASSCODE);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

const LAST_SEEN = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

const proposal = {
  proposal_id: "p-1",
  thread_id: "th-1",
  version: 1,
  status: "proposed",
  project_id: "jabx",
  employee_task: "cody.code_review",
  title: "Review the bridge",
  objective: "Check the signed client.",
  scope: ["lib/team-bridge.ts"],
  checks: ["npm test"],
  sources: [],
  budget_minutes: 30,
  created_at: "2026-10-09T10:00:00Z",
  decided_at: null,
  task_id: null
};

const thread = {
  thread_id: "th-1",
  kind: "adam",
  employee_id: null,
  project_id: null,
  task_id: null,
  title: "Adam",
  unread: 0,
  last_message_at: "2026-10-09T10:00:00Z",
  pending_reply: false
};

const team: Record<string, unknown> = {
  "/api/team/snapshot": {
    generated_at: "2026-10-09T10:00:00Z",
    projects: [{ project_id: "jabx", error: null, paused: false, last_event_at: null, event_count: 1, duplicates_ignored: 0, rejected_count: 0, rejected_lines: [] }],
    employees: [
      { id: "adam", name: "Adam Carter", role: "Team Lead", photo: null },
      { id: "cody", name: "Cody Morgan", role: "Software Engineer", photo: null }
    ],
    tasks: []
  },
  "/api/team/attention": { items: [{ kind: "proposal", proposal }] },
  "/api/team/threads": { threads: [thread] },
  "/api/team/threads/th-1": {
    thread,
    messages: [
      { message_id: "m-1", thread_id: "th-1", role: "adam", body: "Here is a plan.", created_at: "2026-10-09T10:00:00Z", proposal_id: "p-1", status: "sent" }
    ],
    events: []
  },
  "/api/team/proposals/p-1": proposal,
  "/api/team/runner": { online: true, last_heartbeat_at: null }
};

// Answers /api/team/* as the laptop would: offline (503) or with the fixed team.
async function laptop(page: Page, state: { online: boolean }) {
  await page.route("**/api/team/**", async (route: Route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/api/team/status") {
      return route.fulfill({ json: { online: state.online, lastSeenAt: LAST_SEEN, runnerOnline: state.online } });
    }
    if (!state.online) return route.fulfill({ status: 503, json: { online: false, lastSeenAt: LAST_SEEN } });
    const body = team[path];
    return body ? route.fulfill({ json: body }) : route.fulfill({ status: 404, json: { error: "not_found" } });
  });
}

test("the AI Team tab needs a sign-in", async ({ page }) => {
  await page.goto("/ai-team");
  await expect(page).toHaveURL(/\/login$/);
});

test.describe("signed in", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test("offline: the MacBook mark and message, then back online without a reload", async ({ page }) => {
    const state = { online: false };
    await laptop(page, state);
    await page.goto("/ai-team");

    const offline = page.getByRole("region", { name: "AI team offline" });
    await expect(offline.getByRole("heading", { name: "Your AI team is offline" })).toBeVisible();
    await expect(offline.getByRole("img", { name: "MacBook disconnected" })).toBeVisible();
    await expect(offline).toContainText("Your MacBook is off or asleep. Last seen 2 h ago.");
    await expect(offline).toContainText("Tasks, projects and resources still work.");
    // The six people still show, from dash's own list.
    await expect(page.getByRole("region", { name: "Employees" }).getByRole("heading", { level: 3 })).toHaveCount(6);

    // The laptop wakes up: returning to the tab loads at once and clears the offline state.
    state.online = true;
    await page.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));
    await expect(offline).toHaveCount(0);
    await expect(page.getByRole("region", { name: "Needs your attention" })).toContainText("Review the bridge");
  });

  test("Approve asks for Face ID first", async ({ page }) => {
    await laptop(page, { online: true });
    await page.goto("/ai-team");

    await page.getByRole("region", { name: "Needs your attention" }).getByRole("button", { name: /Review the bridge/ }).click();
    const conversation = page.getByRole("dialog", { name: /Conversation/ });
    await expect(conversation).toContainText("Adam's replies use Jaber's Claude Pro allowance (Sonnet 5.5)");
    await conversation.getByRole("button", { name: "Approve" }).click();

    // The test account has no passkey, so the sheet says how to add one.
    const sheet = page.getByRole("dialog", { name: "Confirm with Face ID" });
    await expect(sheet).toBeVisible();
    await expect(sheet).toContainText("Add Face ID in Settings to approve or start work from here");
    await expect(sheet.getByRole("link", { name: "Open Settings" })).toHaveAttribute("href", "/settings");
  });
});

test.describe("iPhone", () => {
  test.use({ viewport: { width: 375, height: 812 }, hasTouch: true });

  test("the tab bar is Home · Tasks · Projects · AI Team · More", async ({ page }) => {
    await signIn(page);
    await laptop(page, { online: false });
    await page.goto("/ai-team");
    const tabs = page.getByRole("navigation", { name: "Dashboard" }).locator(":scope > a, :scope > button");
    await expect(tabs).toHaveCount(5);
    const labels = ["Home", "Tasks", "Projects", "AI Team", "More"];
    for (const [index, label] of labels.entries()) await expect(tabs.nth(index)).toContainText(label);
    for (const index of labels.keys()) {
      const box = await tabs.nth(index).boundingBox();
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
    }
    // Offline: the AI Team tab shows the muted dot.
    await expect(tabs.nth(3)).toContainText("MacBook offline");
  });
});
