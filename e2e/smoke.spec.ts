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
