import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn().mockImplementation(() => {
    throw new Error("NEXT_REDIRECT");
  }),
  usePathname: vi.fn().mockReturnValue("/search"),
  useRouter: vi.fn().mockReturnValue({ push: vi.fn() }),
}));
vi.mock("@/components/ui/MobileHomeHeader", () => ({
  MobileHomeHeader: () => <div data-testid="mobile-header" />,
}));
vi.mock("./SearchResults", () => ({
  SearchResults: ({ q }: { q: string }) => (
    <div data-testid="search-results" data-q={q} />
  ),
}));

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import SearchPage from "./page";

const mockAuth = vi.mocked(auth);
const mockRedirect = vi.mocked(redirect);

function makeSearchParams(q?: string) {
  return Promise.resolve({ q });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue(null as never);
});

describe("SearchPage", () => {
  describe("未認証ユーザー", () => {
    it("q あり: /login?callbackUrl=%2Fsearch%3Fq%3Dfoo へリダイレクトする", async () => {
      await expect(SearchPage({ searchParams: makeSearchParams("foo") })).rejects.toThrow(
        "NEXT_REDIRECT",
      );
      expect(mockRedirect).toHaveBeenCalledWith(
        "/login?callbackUrl=%2Fsearch%3Fq%3Dfoo",
      );
    });

    it("q なし: /login?callbackUrl=%2Fsearch へリダイレクトする", async () => {
      await expect(SearchPage({ searchParams: makeSearchParams() })).rejects.toThrow(
        "NEXT_REDIRECT",
      );
      expect(mockRedirect).toHaveBeenCalledWith("/login?callbackUrl=%2Fsearch");
    });
  });

  describe("認証済みユーザー", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
    });

    it("q が空のとき「検索キーワードを入力してください」を表示する", async () => {
      render(await SearchPage({ searchParams: makeSearchParams() }));
      expect(screen.getByText("検索キーワードを入力してください")).toBeTruthy();
    });

    it("q が空白のみのとき「検索キーワードを入力してください」を表示する", async () => {
      render(await SearchPage({ searchParams: makeSearchParams("   ") }));
      expect(screen.getByText("検索キーワードを入力してください")).toBeTruthy();
    });

    it("q があるとき SearchResults をマウントし q を渡す", async () => {
      render(await SearchPage({ searchParams: makeSearchParams("apex") }));
      const results = screen.getByTestId("search-results");
      expect(results).toBeTruthy();
      expect(results.getAttribute("data-q")).toBe("apex");
    });

    it("q があるとき見出しに検索ワードを表示する", async () => {
      render(await SearchPage({ searchParams: makeSearchParams("minecraft") }));
      expect(screen.getByText("「minecraft」の検索結果")).toBeTruthy();
    });

    it("q の前後の空白をトリムして SearchResults に渡す", async () => {
      render(await SearchPage({ searchParams: makeSearchParams("  apex  ") }));
      const results = screen.getByTestId("search-results");
      expect(results.getAttribute("data-q")).toBe("apex");
    });
  });
});
