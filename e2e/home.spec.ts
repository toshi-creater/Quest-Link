import { test, expect } from "@playwright/test";

test.describe("ホームページ", () => {
  test("/ にアクセスするとページが表示される", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h2").first()).toBeVisible();
  });

  test("ヘッダーまたはナビゲーションが表示される", async ({ page }) => {
    await page.goto("/");
    const header = page.locator("header");
    const nav = page.locator("nav");
    const hasHeader = (await header.count()) > 0;
    const hasNav = (await nav.count()) > 0;
    expect(hasHeader || hasNav).toBe(true);
  });
});
