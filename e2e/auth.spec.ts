import { test, expect } from "@playwright/test";

test.describe("認証リダイレクト", () => {
  test("未認証で /users/me にアクセスすると /login にリダイレクトされる", async ({
    page,
  }) => {
    await page.goto("/users/me");
    await expect(page).toHaveURL(/\/login/);
  });

  test("/login に「Googleでログイン」ボタンが存在する", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("button", { name: "Googleでログイン" })).toBeVisible();
  });

  test("未認証で /rooms にアクセスすると /login にリダイレクトされる", async ({ page }) => {
    await page.goto("/rooms");
    await expect(page).toHaveURL(/\/login/);
  });
});
