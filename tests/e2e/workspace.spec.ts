import { expect, test } from "@playwright/test";

test("workspace shows row-major tiles and lets columns change", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByLabel("Camera tabs")).toBeVisible();
  await expect(page.getByLabel("Grid columns")).toHaveValue("4");

  const grid = page.locator(".tile-grid");
  await expect(grid).toHaveCSS("overflow", "hidden");
  const firstTile = page.locator(".tile-slot").first();
  await expect(firstTile).toBeVisible();
  const firstTileBox = await firstTile.boundingBox();
  expect(firstTileBox?.height).toBeGreaterThan(80);

  await page.getByLabel("Grid columns").selectOption("5");
  await expect(page.getByLabel("Grid columns")).toHaveValue("5");
  const resizedTileBox = await firstTile.boundingBox();
  expect(resizedTileBox?.height).toBeGreaterThan(80);
});
