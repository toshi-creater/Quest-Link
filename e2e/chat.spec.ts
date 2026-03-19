import { test, expect } from "@playwright/test";

test.describe("チャットページ", () => {
  test("未認証で /rooms/[roomId]/chat にアクセスすると /login にリダイレクトされる", async ({
    page,
  }) => {
    await page.goto("/rooms/dummy-room-id/chat");
    await expect(page).toHaveURL(/\/login/);
  });
});
