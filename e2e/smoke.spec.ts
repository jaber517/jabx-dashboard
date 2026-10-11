import { expect, test, type Page } from "@playwright/test";
import { PASSCODE } from "../playwright.config";

async function signIn(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Passcode").fill(PASSCODE);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

function column(page: Page, name: string) {
  return page.locator(`section[aria-label="${name}"]`);
}

test.describe("privacy", () => {
  test("dashboard pages need a sign-in", async ({ page }) => {
    await page.goto("/tasks");
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading", { name: "Private workspace" })).toBeVisible();
  });

  test("dashboard pages don't exist on the public site", async ({ request }) => {
    const response = await request.get("http://localhost:3100/tasks", { maxRedirects: 0 });
    expect(response.status()).toBe(404);
  });

  test("a wrong passcode is refused", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Passcode").fill("not-the-passcode");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page.locator("#login-error")).toContainText("Wrong passcode");
    await expect(page).toHaveURL(/\/login\?error=1$/);
  });
});

test.describe("signed in", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test("home shows the overview and next up", async ({ page }) => {
    await expect(page.getByRole("region", { name: "Overview" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Next up" })).toBeVisible();
  });

  test("quick-add a task, drag it to Done, delete it and undo", async ({ page }) => {
    const title = `Smoke test ${Date.now()}`;
    await page.goto("/tasks");

    // Quick add into To Do.
    await column(page, "To Do").getByRole("button", { name: "Add task" }).click();
    await column(page, "To Do").getByRole("textbox").fill(title);
    await page.keyboard.press("Enter");
    const card = page.locator("article", { hasText: title });
    await expect(column(page, "To Do").locator("article", { hasText: title })).toBeVisible();

    // Drag it to Done.
    await card.dragTo(column(page, "Done"));
    await expect(column(page, "Done").locator("article", { hasText: title })).toBeVisible();
    await expect(page.getByRole("status").filter({ hasText: "Moved" })).toBeVisible();

    // Delete, then undo: it comes back.
    await column(page, "Done").locator("article", { hasText: title }).getByRole("button", { name: "Delete task" }).click();
    await expect(card).toHaveCount(0);
    await page.getByRole("status").filter({ hasText: "Deleted" }).getByRole("button", { name: "Undo" }).click();
    await expect(column(page, "Done").locator("article", { hasText: title })).toBeVisible();

    // Delete for real and let the undo window pass.
    await column(page, "Done").locator("article", { hasText: title }).getByRole("button", { name: "Delete task" }).click();
    await page.waitForTimeout(7000);
    await page.reload();
    await expect(page.locator("article", { hasText: title })).toHaveCount(0);
  });

  test("completing a repeating task creates the next one; undo takes it back", async ({ page }) => {
    const title = `Weekly check ${Date.now()}`;
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kuwait" }).format(new Date());
    await page.goto("/tasks");

    await page.getByRole("button", { name: "Add Task" }).first().click();
    const dialog = page.getByRole("dialog", { name: "Add Task" });
    await dialog.getByLabel("Title").fill(title);
    await dialog.getByLabel("Due date").fill(today);
    await dialog.getByLabel("Repeat").selectOption("WEEKLY");
    await dialog.getByRole("button", { name: /save|add|create/i }).last().click();
    await expect(dialog).toBeHidden();

    const cards = page.locator("article", { hasText: title });
    await expect(cards).toHaveCount(1);
    await expect(cards.first()).toContainText("Weekly");

    // Complete it: the done one moves to Done and a new one is due in a week.
    await cards.first().getByRole("button", { name: "Mark done" }).click();
    await expect(cards).toHaveCount(2);
    await expect(column(page, "Done").locator("article", { hasText: title })).toHaveCount(1);
    await expect(column(page, "To Do").locator("article", { hasText: title })).toHaveCount(1);

    // Undo the completion: the next occurrence goes away again.
    await page.getByRole("status").filter({ hasText: "Completed" }).getByRole("button", { name: "Undo" }).click();
    await expect(cards).toHaveCount(1);
    await expect(column(page, "Done").locator("article", { hasText: title })).toHaveCount(0);
  });

  test("checklist: create with steps, tick them all, mark the task done", async ({ page }) => {
    const title = `Checklist task ${Date.now()}`;
    await page.goto("/tasks");

    await page.getByRole("button", { name: "Add Task" }).first().click();
    const dialog = page.getByRole("dialog", { name: "Add Task" });
    await dialog.getByLabel("Title").fill(title);
    await dialog.getByLabel("Steps (optional)").fill("- Book the room\n- Send the agenda");
    await dialog.getByRole("button", { name: /save|add|create/i }).last().click();
    await expect(dialog).toBeHidden();

    const card = page.locator("article", { hasText: title });
    await expect(card).toContainText("0/2");

    // On the task page: add a third step, then tick all three.
    await card.getByRole("link", { name: title }).click();
    const steps = page.getByRole("list", { name: "Steps" });
    await expect(steps.getByRole("listitem")).toHaveCount(2);
    await expect(steps).toContainText("Book the room"); // bullet mark stripped
    await page.getByLabel("Add a step").fill("Print handouts");
    await page.keyboard.press("Enter");
    await expect(steps.getByRole("listitem")).toHaveCount(3);
    await expect(page.getByText("0 of 3")).toBeVisible();

    for (const text of ["Book the room", "Send the agenda", "Print handouts"]) {
      await steps.getByRole("checkbox", { name: `Tick “${text}”` }).check();
    }
    await expect(page.getByText("3 of 3")).toBeVisible();
    await page.getByRole("status").filter({ hasText: "All steps done" }).getByRole("button", { name: "Mark task done" }).click();

    // Back on the board: the task is done with a full checklist.
    await page.goto("/tasks");
    await expect(column(page, "Done").locator("article", { hasText: title })).toContainText("3/3");
  });

  test("⌘K opens the palette with create actions", async ({ page }) => {
    await page.keyboard.press("ControlOrMeta+k");
    const palette = page.getByRole("dialog", { name: "Search" });
    await expect(palette).toBeVisible();
    await expect(palette.getByRole("button", { name: "New task" })).toBeVisible();
    await page.keyboard.press("Escape");
  });

  test("filters survive in the address", async ({ page }) => {
    await page.goto("/tasks?quick=BLOCKED");
    await expect(page.getByRole("button", { name: "Blocked", pressed: true })).toBeVisible();
  });
});

test.describe("public site", () => {
  const site = "http://localhost:3100";
  // Inlined at build time, so a run tests one state: the email fallback by default, or the
  // form with NEXT_PUBLIC_LEADS_FORM_URL=https://leads.example.test/api/leads npx playwright test
  const leadsUrl = process.env.NEXT_PUBLIC_LEADS_FORM_URL;

  async function fillValid(page: Page, problem: string) {
    const form = page.getByRole("form", { name: "Request a quote" });
    await form.getByLabel("Your name").fill("Test Person");
    await form.getByLabel("Company").fill("Test Co");
    await form.getByLabel("Sector").selectOption("Logistics");
    await form.getByLabel("Email").fill("test@example.com");
    await form.getByLabel("What problem do you want to solve?").fill(problem);
    await form.getByLabel("Timing").selectOption("Within a month");
    return form;
  }

  test("services lists the three packages with no prices", async ({ page }) => {
    await page.goto(`${site}/services`);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Useful software");
    for (const name of ["Business Website", "Operations Dashboard", "Business Automation"]) {
      await expect(page.getByRole("heading", { name, level: 3 })).toBeVisible();
    }
    await expect(page.getByRole("main")).not.toContainText(/KWD|\bKD\b|\$|price:/i);
    await expect(page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: "Services" })).toHaveAttribute("aria-current", "page");
  });

  test("contact offers email when the form has no endpoint", async ({ page }) => {
    test.skip(Boolean(leadsUrl), "built with a leads endpoint");
    await page.goto(`${site}/contact`);
    await expect(page.getByRole("form", { name: "Request a quote" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Send an email" })).toHaveAttribute("href", "mailto:contact@jabx.me");
  });

  test("contact form validates, then thanks after a 2xx", async ({ page }) => {
    test.skip(!leadsUrl, "built without a leads endpoint");
    let body: unknown = null;
    await page.route(leadsUrl!, async (route) => {
      body = route.request().postDataJSON();
      await route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ ok: true }) });
    });
    await page.goto(`${site}/contact?package=operations-dashboard`);
    const empty = page.getByRole("form", { name: "Request a quote" });
    await expect(empty.getByLabel("Which package?")).toHaveValue("operations-dashboard");
    await empty.getByRole("button", { name: "Send request" }).click();
    await expect(empty.getByText("Please enter your name.")).toBeVisible();
    await expect(empty.getByLabel("Your name")).toBeFocused();

    const form = await fillValid(page, "Too short");
    await form.getByRole("button", { name: "Send request" }).click();
    await expect(form.getByText("at least 20 characters")).toBeVisible();
    expect(body).toBeNull();

    await form.getByLabel("What problem do you want to solve?").fill("Our inspection reports live in five spreadsheets.");
    await form.getByRole("button", { name: "Send request" }).click();
    await expect(page.getByRole("heading", { name: "Thank you. Your request is in." })).toBeVisible();
    expect(body).toMatchObject({ name: "Test Person", package: "operations-dashboard", sector: "Logistics", phone: "", website: "" });
  });

  test("contact form shows the email address when sending fails", async ({ page }) => {
    test.skip(!leadsUrl, "built without a leads endpoint");
    await page.route(leadsUrl!, (route) => route.fulfill({ status: 429, contentType: "application/json", body: JSON.stringify({ error: "Too many requests." }) }));
    await page.goto(`${site}/contact?package=business-website`);
    const form = await fillValid(page, "We need a simple bilingual website.");
    await form.getByRole("button", { name: "Send request" }).click();
    await expect(form.getByRole("alert")).toContainText("contact@jabx.me");
    await expect(form.getByRole("button", { name: "Send request" })).toBeEnabled();
  });
});
