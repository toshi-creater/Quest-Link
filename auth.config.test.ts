import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { Session } from "next-auth";
import type { NextRequest } from "next/server";
import { authConfig, stagingCredentialsAuthorize, lhciCredentialsAuthorize } from "./auth.config";

const authorized = authConfig.callbacks!.authorized!;

function makeRequest(
  pathname: string,
  params: Record<string, string> = {},
  cookieMap: Record<string, string> = {}
) {
  const url = new URL(`http://localhost${pathname}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return {
    nextUrl: url,
    cookies: {
      get: (name: string) => (cookieMap[name] ? { value: cookieMap[name] } : undefined),
    },
  } as unknown as NextRequest;
}

function makeAuth(needsProfileSetup = false): Session {
  return {
    user: {
      id: "user-1",
      name: "Test User",
      email: "test@example.com",
      username: "testuser",
      iconUrl: null,
      avgRating: 0,
      needsProfileSetup,
    },
    expires: new Date(Date.now() + 3600 * 1000).toISOString(),
  };
}

describe("authorized コールバック", () => {
  describe("ログインページ (/login)", () => {
    it("未ログインの場合 true を返す", async () => {
      const result = await authorized({ auth: null, request: makeRequest("/login") });
      expect(result).toBe(true);
    });

    it("ログイン済みの場合 / へリダイレクトする", async () => {
      const result = await authorized({ auth: makeAuth(), request: makeRequest("/login") });
      expect(result).toBeInstanceOf(Response);
      expect((result as Response).headers.get("location")).toBe("http://localhost/");
    });
  });

  describe("未ログイン保護（全画面ログイン必須化）", () => {
    it("/ に未ログインでアクセスすると false を返す", async () => {
      const result = await authorized({ auth: null, request: makeRequest("/") });
      expect(result).toBe(false);
    });

    it("/rooms に未ログインでアクセスすると false を返す", async () => {
      const result = await authorized({ auth: null, request: makeRequest("/rooms") });
      expect(result).toBe(false);
    });

    it("/rooms/abc-123（inviteToken なし）に未ログインでアクセスすると false を返す", async () => {
      const result = await authorized({ auth: null, request: makeRequest("/rooms/abc-123") });
      expect(result).toBe(false);
    });

    it("/users/me に未ログインでアクセスすると false を返す", async () => {
      const result = await authorized({ auth: null, request: makeRequest("/users/me") });
      expect(result).toBe(false);
    });
  });

  describe("招待リンク経由の部屋詳細（未ログインアクセス許可）", () => {
    it("inviteToken あり → 未ログインでも true を返す", async () => {
      const result = await authorized({
        auth: null,
        request: makeRequest("/rooms/abc-123", { inviteToken: "tok" }),
      });
      expect(result).toBe(true);
    });

    it("inviteToken + guestFlow=true → 未ログインでも true を返す", async () => {
      const result = await authorized({
        auth: null,
        request: makeRequest("/rooms/abc-123", { inviteToken: "tok", guestFlow: "true" }),
      });
      expect(result).toBe(true);
    });

    it("サブパス /rooms/abc-123/chat は inviteToken があっても未ログインは false を返す", async () => {
      const result = await authorized({
        auth: null,
        request: makeRequest("/rooms/abc-123/chat", { inviteToken: "tok" }),
      });
      expect(result).toBe(false);
    });
  });

  describe("ゲストセッション経由のアクセス許可", () => {
    const guestCookie = { quest_link_guest_session: "guest_abc123" };

    it("/rooms/abc-123 にゲストセッションがあれば未ログインでも true を返す", async () => {
      const result = await authorized({
        auth: null,
        request: makeRequest("/rooms/abc-123", {}, guestCookie),
      });
      expect(result).toBe(true);
    });

    it("/rooms/abc-123/chat にゲストセッションがあれば未ログインでも true を返す", async () => {
      const result = await authorized({
        auth: null,
        request: makeRequest("/rooms/abc-123/chat", {}, guestCookie),
      });
      expect(result).toBe(true);
    });

    it("/rooms/abc-123/ratings にゲストセッションがあれば未ログインでも true を返す", async () => {
      const result = await authorized({
        auth: null,
        request: makeRequest("/rooms/abc-123/ratings", {}, guestCookie),
      });
      expect(result).toBe(true);
    });

    it("/rooms/abc-123/chat にゲストセッションなし・inviteToken なしは false を返す", async () => {
      const result = await authorized({
        auth: null,
        request: makeRequest("/rooms/abc-123/chat"),
      });
      expect(result).toBe(false);
    });

    it("/rooms/abc-123/chat は inviteToken のみでは false を返す（サブパスは inviteToken 不可）", async () => {
      const result = await authorized({
        auth: null,
        request: makeRequest("/rooms/abc-123/chat", { inviteToken: "tok" }),
      });
      expect(result).toBe(false);
    });

    it("/rooms/new はゲストセッションがあっても false を返す", async () => {
      const result = await authorized({
        auth: null,
        request: makeRequest("/rooms/new", {}, guestCookie),
      });
      expect(result).toBe(false);
    });

    it("/rooms/new は inviteToken があっても false を返す", async () => {
      const result = await authorized({
        auth: null,
        request: makeRequest("/rooms/new", { inviteToken: "tok" }),
      });
      expect(result).toBe(false);
    });

    it("/rooms/current にゲストセッションがあれば未ログインでも true を返す", async () => {
      const result = await authorized({
        auth: null,
        request: makeRequest("/rooms/current", {}, guestCookie),
      });
      expect(result).toBe(true);
    });

    it("/rooms/current/chat にゲストセッションがあれば未ログインでも true を返す", async () => {
      const result = await authorized({
        auth: null,
        request: makeRequest("/rooms/current/chat", {}, guestCookie),
      });
      expect(result).toBe(true);
    });
  });

  describe("ログイン済み・通常アクセス", () => {
    it("/ にログイン済みでアクセスすると true を返す", async () => {
      const result = await authorized({ auth: makeAuth(), request: makeRequest("/") });
      expect(result).toBe(true);
    });

    it("/rooms にログイン済みでアクセスすると true を返す", async () => {
      const result = await authorized({ auth: makeAuth(), request: makeRequest("/rooms") });
      expect(result).toBe(true);
    });

    it("/rooms/abc-123 にログイン済みでアクセスすると true を返す", async () => {
      const result = await authorized({ auth: makeAuth(), request: makeRequest("/rooms/abc-123") });
      expect(result).toBe(true);
    });
  });

  describe("プロフィール未設定フロー (needsProfileSetup=true)", () => {
    it("通常ページへのアクセスは /onboarding へリダイレクトする", async () => {
      const result = await authorized({ auth: makeAuth(true), request: makeRequest("/rooms") });
      expect(result).toBeInstanceOf(Response);
      expect((result as Response).headers.get("location")).toBe("http://localhost/onboarding");
    });

    it("/onboarding 自体は needsProfileSetup=true でもアクセス可能", async () => {
      const result = await authorized({ auth: makeAuth(true), request: makeRequest("/onboarding") });
      expect(result).toBe(true);
    });

    it("招待URL + error なし → error=new_user 付きで同URLへリダイレクトする", async () => {
      const result = await authorized({
        auth: makeAuth(true),
        request: makeRequest("/rooms/abc", { inviteToken: "xxx" }),
      });
      expect(result).toBeInstanceOf(Response);
      const location = new URL((result as Response).headers.get("location")!);
      expect(location.pathname).toBe("/rooms/abc");
      expect(location.searchParams.get("inviteToken")).toBe("xxx");
      expect(location.searchParams.get("error")).toBe("new_user");
    });

    it("招待URL + error=new_user あり → true を返す（無限ループ防止）", async () => {
      const result = await authorized({
        auth: makeAuth(true),
        request: makeRequest("/rooms/abc", { inviteToken: "xxx", error: "new_user" }),
      });
      expect(result).toBe(true);
    });
  });
});

describe("stagingCredentialsAuthorize", () => {
  const SECRET = "test-secret";

  beforeEach(() => vi.stubEnv("CREDENTIALS_LOGIN_SECRET", SECRET));
  afterEach(() => vi.unstubAllEnvs());

  it("正しい email + password で User を返す", async () => {
    const result = await stagingCredentialsAuthorize({
      email: "loadtest+1@example.com",
      password: SECRET,
    });
    expect(result).toMatchObject({ id: "loadtest+1@example.com", name: "loadtest+1" });
  });

  it("loadtest+99 も受け付ける", async () => {
    const result = await stagingCredentialsAuthorize({
      email: "loadtest+99@example.com",
      password: SECRET,
    });
    expect(result).toMatchObject({ id: "loadtest+99@example.com", name: "loadtest+99" });
  });

  it("数字なしの loadtest メールは null を返す", async () => {
    const result = await stagingCredentialsAuthorize({
      email: "loadtest@example.com",
      password: SECRET,
    });
    expect(result).toBeNull();
  });

  it("パターン外の email は null を返す", async () => {
    const result = await stagingCredentialsAuthorize({
      email: "admin@example.com",
      password: SECRET,
    });
    expect(result).toBeNull();
  });

  it("パスワード不一致は null を返す", async () => {
    const result = await stagingCredentialsAuthorize({
      email: "loadtest+1@example.com",
      password: "wrong",
    });
    expect(result).toBeNull();
  });

  it("CREDENTIALS_LOGIN_SECRET 未設定は null を返す", async () => {
    vi.stubEnv("CREDENTIALS_LOGIN_SECRET", "");
    const result = await stagingCredentialsAuthorize({
      email: "loadtest+1@example.com",
      password: "",
    });
    expect(result).toBeNull();
  });
});

describe("STAGING_AUTH_BYPASS 未設定のとき", () => {
  it("staging-credentials provider が providers 配列に存在しない", () => {
    // テスト実行時は STAGING_AUTH_BYPASS が未設定のため、static import で providers = 3件
    const found = authConfig.providers.some(
      (p) => (p as { id?: string }).id === "staging-credentials"
    );
    expect(found).toBe(false);
  });
});

describe("lhciCredentialsAuthorize", () => {
  beforeEach(() => {
    vi.stubEnv("LHCI_TEST_EMAIL", "lhci@example.com");
    vi.stubEnv("LHCI_TEST_PASSWORD", "test-password");
  });
  afterEach(() => vi.unstubAllEnvs());

  it("正しい email + password で User を返す", async () => {
    const result = await lhciCredentialsAuthorize({
      email: "lhci@example.com",
      password: "test-password",
    });
    expect(result).toMatchObject({ id: "lhci@example.com", email: "lhci@example.com", name: "lhci" });
  });

  it("email 不一致は null を返す", async () => {
    const result = await lhciCredentialsAuthorize({
      email: "other@example.com",
      password: "test-password",
    });
    expect(result).toBeNull();
  });

  it("password 不一致は null を返す", async () => {
    const result = await lhciCredentialsAuthorize({
      email: "lhci@example.com",
      password: "wrong",
    });
    expect(result).toBeNull();
  });

  it("LHCI_TEST_EMAIL 未設定は null を返す", async () => {
    vi.stubEnv("LHCI_TEST_EMAIL", "");
    const result = await lhciCredentialsAuthorize({
      email: "lhci@example.com",
      password: "test-password",
    });
    expect(result).toBeNull();
  });

  it("LHCI_TEST_PASSWORD 未設定は null を返す", async () => {
    vi.stubEnv("LHCI_TEST_PASSWORD", "");
    const result = await lhciCredentialsAuthorize({
      email: "lhci@example.com",
      password: "",
    });
    expect(result).toBeNull();
  });
});

describe("LHCI_TEST_ENABLED 未設定のとき", () => {
  it("lhci-credentials provider が providers 配列に存在しない", () => {
    // テスト実行時は LHCI_TEST_ENABLED が未設定のため lhci-credentials は含まれない
    const found = authConfig.providers.some(
      (p) => (p as { id?: string }).id === "lhci-credentials"
    );
    expect(found).toBe(false);
  });
});
