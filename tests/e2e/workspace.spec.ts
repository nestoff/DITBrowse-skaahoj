import { expect, test } from "@playwright/test";

test("workspace shows row-major tiles and lets columns change", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByLabel("Camera tabs")).toBeVisible();
  await expect(page.getByLabel("Browser toolbar")).toBeVisible();
  await expect(page.getByLabel("Workspace tools")).toBeVisible();
  await expect(page.getByLabel("Camera workspace tools")).toBeHidden();
  await expect(page.getByLabel("Grid columns")).toHaveValue("4");

  const tabsBox = await page.getByLabel("Camera tabs").boundingBox();
  const toolbarBox = await page.getByLabel("Browser toolbar").boundingBox();
  expect(tabsBox?.y).toBeLessThan(toolbarBox?.y ?? 0);

  await page.getByLabel("Workspace tools").click();
  await expect(page.getByLabel("Camera workspace tools")).toBeVisible();
  await expect(page.getByLabel("Job and camera list")).toBeVisible();

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

  const secondTileBox = await page.locator(".tile-slot").nth(1).boundingBox();
  expect(Math.abs((resizedTileBox?.height ?? 0) - (secondTileBox?.height ?? 0))).toBeLessThan(1);
});

test("selected camera address overrides can return to prefix and suffix style", async ({ page }) => {
  await page.goto("/");

  const address = page.getByRole("textbox", { name: "Address" });
  await expect(address).toHaveValue("http://192.168.1.41");

  await address.fill("10.20.100.2");
  await address.press("Enter");

  await expect(address).toHaveValue("http://10.20.100.2");
  await expect(page.locator('webview[data-tile-id="tile-41"]')).toHaveAttribute(
    "src",
    "http://10.20.100.2"
  );

  const returnToPrefix = page.getByRole("button", {
    name: "Go back to prefix and suffix style"
  });
  await expect(returnToPrefix).toBeVisible();

  await returnToPrefix.click();

  await expect(address).toHaveValue("http://192.168.1.41");
  await expect(returnToPrefix).toBeHidden();
});
