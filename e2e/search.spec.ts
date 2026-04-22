import { test, expect } from "@playwright/test";

test.describe("検索結果画面", () => {
  test("未認証で /search?q=foo にアクセスすると /login にリダイレクトされる", async ({
    page,
  }) => {
    await page.goto("/search?q=foo");
    await expect(page).toHaveURL(/\/login/);
  });

  test("未認証で /search にアクセスすると /login にリダイレクトされる", async ({
    page,
  }) => {
    await page.goto("/search");
    await expect(page).toHaveURL(/\/login/);
  });

  test("リダイレクト先の /login に callbackUrl が含まれる", async ({ page }) => {
    await page.goto("/search?q=apex");
    await expect(page).toHaveURL(/callbackUrl/);
  });
});
