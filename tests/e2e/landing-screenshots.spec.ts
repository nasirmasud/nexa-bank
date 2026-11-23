import { test, expect } from "@playwright/test";

const viewports = [
  { name: "375x812", width: 375, height: 812 },
  { name: "768x1024", width: 768, height: 1024 },
  { name: "1280x720", width: 1280, height: 720 },
] as const;

const themes = ["light", "dark"] as const;

for (const theme of themes) {
  for (const viewport of viewports) {
    test(`landing ${viewport.name} ${theme}`, async ({ page }) => {
      await page.addInitScript((value) => {
        window.localStorage.setItem("theme", value);
      }, theme);

      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto("/", { waitUntil: "networkidle" });

      if (theme === "dark") {
        await expect(page.locator("html")).toHaveClass(/dark/);
      } else {
        await expect(page.locator("html")).not.toHaveClass(/dark/);
      }

      await page.waitForTimeout(500);
      await page.screenshot({
        path: `screenshots/landing-${viewport.name}-${theme}.png`,
        fullPage: true,
      });
    });
  }
}
