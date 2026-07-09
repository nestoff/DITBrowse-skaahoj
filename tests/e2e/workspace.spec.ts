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

  await expect(page.getByLabel("Selected tile zoom")).toBeVisible();
  await page.getByLabel("Selected tile zoom").fill("0.82");
  await expect(page.getByLabel("Selected tile zoom")).toHaveValue("0.82");

  await page.getByLabel("Close A").click();
  await expect(page.getByLabel("Close A")).toHaveCount(0);
  await expect(page.getByRole("textbox", { name: "Address" })).toHaveValue("http://192.168.1.02");
});

test("toolbar stays inside the window at supported widths", async ({ page }) => {
  await page.goto("/");

  for (const width of [960, 1180, 1440]) {
    await page.setViewportSize({ width, height: 800 });
    const toolbar = page.getByLabel("Browser toolbar");
    const box = await toolbar.boundingBox();
    expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(width);
    await expect(page.getByRole("textbox", { name: "Address" })).toBeVisible();
    await expect(page.getByLabel("Focus selected page")).toBeVisible();
    await expect(page.getByLabel("Grid columns")).toBeVisible();
    await expect(page.getByLabel("Selected tile zoom")).toBeVisible();
    await expect(page.getByLabel("Selected tile viewport")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
  }
});

test("selected camera address overrides can return to prefix and suffix style", async ({ page }) => {
  await page.goto("/");

  const address = page.getByRole("textbox", { name: "Address" });
  await expect(address).toHaveValue("http://192.168.1.01");

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

  await expect(address).toHaveValue("http://192.168.1.01");
  await expect(returnToPrefix).toBeHidden();
});

test("focus mode singles out the selected page without unmounting webviews", async ({ page }) => {
  await page.goto("/");

  const grid = page.locator(".tile-grid");
  await expect(page.locator("webview")).toHaveCount(12);
  const gridBox = await grid.boundingBox();

  await page.getByLabel("Focus selected page").click();

  await expect(grid).toHaveClass(/focus-mode/);
  await expect(page.locator("webview")).toHaveCount(12);

  const firstTile = page.locator('.tile-slot:has(webview[data-tile-id="tile-41"])');
  const secondTile = page.locator('.tile-slot:has(webview[data-tile-id="tile-42"])');
  await expect(firstTile).toBeVisible();
  await expect(secondTile).toBeHidden();

  const focusedBox = await firstTile.boundingBox();
  expect(focusedBox?.width).toBeGreaterThan((gridBox?.width ?? 0) - 20);
  expect(focusedBox?.height).toBeGreaterThan((gridBox?.height ?? 0) - 20);

  await page.locator('[aria-label="Tab B"] .tab-select').click();

  await expect(firstTile).toBeHidden();
  await expect(secondTile).toBeVisible();
  await expect(page.getByLabel("Show all pages")).toBeVisible();
  await expect(page.locator("webview")).toHaveCount(12);

  await page.getByLabel("Show all pages").click();

  await expect(grid).not.toHaveClass(/focus-mode/);
  await expect(firstTile).toBeVisible();
  await expect(secondTile).toBeVisible();
});

test("clicking the page area of an inactive tile activates its tab", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByLabel("Tab A")).toHaveClass(/active/);
  await page.getByLabel("Activate B").click();

  await expect(page.getByLabel("Tab B")).toHaveClass(/active/);
  await expect(page.getByRole("textbox", { name: "Address" })).toHaveValue("http://192.168.1.02");
});

test("camera list editor moves down on Enter and across on Tab", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Workspace tools" }).click();
  await page.getByRole("button", { name: "Edit List" }).click();

  await page.getByLabel("A type").focus();
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("B type")).toBeFocused();

  await page.getByLabel("A index").focus();
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("A camera number")).toBeFocused();
});
