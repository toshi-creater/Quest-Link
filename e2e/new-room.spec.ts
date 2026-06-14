import { test, expect } from "@playwright/test";

test.describe("部屋作成ページ（/rooms/new）", () => {
  test("未認証で /rooms/new にアクセスすると /login にリダイレクトされる", async ({
    page,
  }) => {
    await page.goto("/rooms/new");
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("ゲーム選択画面（/games）— 未認証アクセス", () => {
  test("未認証で /games にアクセスすると /login にリダイレクトされる", async ({ page }) => {
    await page.goto("/games");
    await expect(page).toHaveURL(/\/login/);
  });
});
