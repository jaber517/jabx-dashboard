import { expect, test } from "@playwright/test";

const publicOrigin = "http://localhost:3100";
const routes = ["/", "/about", "/services", "/projects", "/team", "/contact"];

for (const width of [1440, 390]) {
  test(`public pages remain readable without JavaScript at ${width}px`, async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width, height: 844 } });
    const page = await context.newPage();
    for (const route of routes) {
      await page.goto(`${publicOrigin}${route}`);
      await expect(page.locator("h1")).toBeVisible();
      await expect(page.locator(".public-reveal").first()).toHaveCSS("opacity", "1");
      await expect(page.locator("[data-reveal-pending]")).toHaveCount(0);
      const signature = page.locator(".public-footer-signature");
      await expect(signature).toHaveAttribute("aria-hidden", "true");
      await expect(signature.locator("svg")).toHaveCSS("color", "rgb(255, 255, 255)");
      await expect(signature.locator('path[fill="#2F80FF"]')).toHaveCSS("fill", "rgb(47, 128, 255)");
      if (route === "/") {
        await expect(page.locator(".public-mark")).toHaveCount(0);
        const copy = await page.locator(".public-home-hero .public-hero-copy").boundingBox();
        const logo = await page.locator(".public-hero-wordmark").boundingBox();
        const container = await page.locator("#public-main").boundingBox();
        expect(copy && logo && container).toBeTruthy();
        expect(logo!.y).toBeGreaterThan(copy!.y + copy!.height);
        expect(logo!.width).toBeCloseTo(container!.width, 0);
        expect(logo!.width / logo!.height).toBeCloseTo(246.6 / 116.6, 2);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    }
    await context.close();
  });

  test(`reduced motion keeps every public page static at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    for (const route of routes) {
      await page.goto(`${publicOrigin}${route}`);
      await expect(page.locator("h1")).toBeVisible();
      await expect(page.locator("html")).not.toHaveClass(/lenis/);
      await expect(page.locator("[data-reveal-pending]")).toHaveCount(0);
      for (const logo of await page.locator(".public-wordmark").all()) {
        await expect(logo).toHaveCSS("animation-name", "none");
        await expect(logo).toHaveCSS("opacity", "1");
        await expect(logo.locator('path[fill="#2F80FF"]')).toHaveCSS("animation-name", "none");
      }
      expect(await page.locator(".public-reveal").evaluateAll((elements) => elements.every((element) => {
        const style = getComputedStyle(element);
        return style.opacity === "1" && style.transform === "none";
      }))).toBe(true);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    }
  });
}

test("reveals become readable on scroll and remain visible when returning", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto(publicOrigin);
  await expect(page.locator("html")).toHaveClass(/lenis/);
  const closing = page.locator(".public-closing");
  await expect(closing).toHaveAttribute("data-reveal-pending", "");
  await closing.scrollIntoViewIfNeeded();
  await expect(closing).not.toHaveAttribute("data-reveal-pending", "");
  await expect(closing).toHaveCSS("opacity", "1");
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(closing).toHaveCSS("opacity", "1");
});

test("skip link and hashes retain native navigation and keyboard focus", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto(publicOrigin);
  await expect(page.locator("html")).toHaveClass(/lenis/);
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#public-main")).toBeFocused();
  await expect(page).toHaveURL(/#public-main$/);
  await page.goto(`${publicOrigin}/#selected-work`);
  await expect(page.locator("#selected-work")).toBeInViewport();
  const top = await page.locator("#selected-work").evaluate((element) => element.getBoundingClientRect().top);
  expect(top).toBeGreaterThanOrEqual(80);
});

test("changing the motion preference disables Lenis and reveals hidden content", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto(publicOrigin);
  await expect(page.locator("html")).toHaveClass(/lenis/);
  await expect(page.locator(".public-closing")).toHaveAttribute("data-reveal-pending", "");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator("html")).not.toHaveClass(/lenis/);
  await expect(page.locator("[data-reveal-pending]")).toHaveCount(0);
  await expect(page.locator(".public-statement-line span").first()).toHaveCSS("opacity", "1");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(page.locator("html")).toHaveClass(/lenis/);
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Private workspace" })).toBeVisible();
  await expect(page.locator(".public-site")).toHaveCount(0);
  await expect(page.locator("html")).not.toHaveClass(/lenis/);
});
