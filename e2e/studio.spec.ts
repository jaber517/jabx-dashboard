import { expect, test } from "@playwright/test";
import { PASSCODE } from "../playwright.config";

test.describe("Studio pipeline", () => {
  test("studio page needs a sign-in", async ({ page }) => {
    await page.goto("/studio");
    await expect(page).toHaveURL(/\/login$/);
  });

  test("signed in shows the studio page and not-connected state", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Passcode").fill(PASSCODE);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page).toHaveURL(/\/dashboard$/);

    await page.goto("/studio");
    await expect(page.getByRole("heading", { name: "Studio" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Leads API not connected" })).toBeVisible();
  });
});
