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
