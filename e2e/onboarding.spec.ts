import { test, expect } from "@playwright/test";

test.describe("オンボーディング", () => {
  test("未認証で /onboarding にアクセスすると /login にリダイレクトされる", async ({
    page,
  }) => {
    await page.goto("/onboarding");
    await expect(page).toHaveURL(/\/login/);
  });
});
