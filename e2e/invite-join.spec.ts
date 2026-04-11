import { test, expect } from "@playwright/test";

test.describe("招待URL参加フロー", () => {
  test("ログインページ（招待経由）に招待バナーが表示される", async ({ page }) => {
    const encodedCallback = encodeURIComponent(
      "/rooms/test-room?inviteToken=test-token"
    );
    await page.goto(`/login?callbackUrl=${encodedCallback}`);
    await expect(
      page.getByText("この部屋に参加するにはログインが必要です")
    ).toBeVisible();
  });

  test("inviteToken なしのログインページには招待バナーが表示されない", async ({
    page,
  }) => {
    await page.goto("/login");
    await expect(
      page.getByText("この部屋に参加するにはログインが必要です")
    ).not.toBeVisible();
  });
});
