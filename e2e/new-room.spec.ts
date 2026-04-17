import { test, expect } from "@playwright/test";

test.describe("部屋作成ページ（/rooms/new）", () => {
  test("未認証で /rooms/new にアクセスすると /login にリダイレクトされる", async ({
    page,
  }) => {
    await page.goto("/rooms/new");
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("ゲーム選択画面（/games）— GamesGrid 共通コンポーネント", () => {
  test("「ゲームを選択」の見出しが表示される", async ({ page }) => {
    await page.goto("/games");
    await expect(
      page.getByRole("heading", { name: "ゲームを選択" })
    ).toBeVisible();
  });

  test("ゲーム検索バーが表示される", async ({ page }) => {
    await page.goto("/games");
    await expect(page.getByRole("textbox")).toBeVisible();
  });

  test("ゲームカードをクリックすると /games/{id}/rooms に遷移する", async ({
    page,
  }) => {
    await page.goto("/games");

    // ゲームカードが少なくとも1件表示されるのを待つ
    const firstGameButton = page.getByRole("button").first();
    await expect(firstGameButton).toBeVisible();

    await firstGameButton.click();
    await expect(page).toHaveURL(/\/games\/.+\/rooms/);
  });
});
