import { test, expect } from "@playwright/test";

test.describe("部屋一覧", () => {
  test("/rooms が表示され h1「部屋一覧」が存在する", async ({ page }) => {
    await page.goto("/rooms");
    await expect(page.getByRole("heading", { name: "部屋一覧" })).toBeVisible();
  });

  test("未認証で /rooms/new にアクセスすると /login にリダイレクトされる", async ({
    page,
  }) => {
    await page.goto("/rooms/new");
    await expect(page).toHaveURL(/\/login/);
  });
});
