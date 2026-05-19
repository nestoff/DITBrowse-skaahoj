import { expect, test } from "@playwright/test";

test("workspace shows row-major tiles and lets columns change", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByLabel("Camera tabs")).toBeVisible();
  await expect(page.getByLabel("Grid columns")).toHaveValue("4");

  const grid = page.locator(".tile-grid");
  await expect(grid).toHaveCSS("overflow", "hidden");

  await page.getByLabel("Grid columns").selectOption("5");
  await expect(page.getByLabel("Grid columns")).toHaveValue("5");
});
