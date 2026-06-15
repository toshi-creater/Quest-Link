import { test, expect } from "@playwright/test";

test.describe("ホームページ", () => {
  test("/ にアクセスするとページが表示される", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h2").first()).toBeVisible();
  });

  test("未認証では /login にリダイレクトされ「Googleでログイン」ボタンが表示される", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole("button", { name: "Googleでログイン" })).toBeVisible();
  });
});
