import { test, expect } from "@playwright/test";

test.describe("部屋一覧", () => {
  test("未認証で /rooms にアクセスすると /login にリダイレクトされる", async ({ page }) => {
    await page.goto("/rooms");
    await expect(page).toHaveURL(/\/login/);
  });

  test("未認証で /rooms/new にアクセスすると /login にリダイレクトされる", async ({
    page,
  }) => {
    await page.goto("/rooms/new");
    await expect(page).toHaveURL(/\/login/);
  });
});
