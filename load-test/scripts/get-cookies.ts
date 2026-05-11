/**
 * staging 環境からテスト用 authjs.session-token cookie を取得して cookies.csv に保存する
 *
 * 前提:
 *   - STAGING_URL: staging の BASE_URL（例: https://quest-link.up.railway.app）
 *   - TEST_ACCOUNTS: カンマ区切りの "email:password" ペア（例: test1@example.com:pass1,...）
 *     またはファイルパスで指定可能（TEST_ACCOUNTS_FILE）
 *
 * 使い方:
 *   export STAGING_URL=https://quest-link.up.railway.app
 *   export TEST_ACCOUNTS_FILE=./test-accounts.txt  # 1行に "email:password" の形式
 *   npx tsx load-test/scripts/get-cookies.ts
 *
 * 出力: load-test/cookies.csv（.gitignore に追加済み）
 */

import { writeFileSync, readFileSync } from "fs";
import { resolve } from "path";

const STAGING_URL = process.env.STAGING_URL ?? "https://quest-link.up.railway.app";
const OUTPUT_PATH = resolve(__dirname, "../cookies.csv");

type Account = { email: string; password: string };

function loadAccounts(): Account[] {
  const file = process.env.TEST_ACCOUNTS_FILE;
  if (file) {
    return readFileSync(file, "utf-8")
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        const [email, ...rest] = line.split(":");
        return { email: email.trim(), password: rest.join(":").trim() };
      });
  }

  const raw = process.env.TEST_ACCOUNTS ?? "";
  if (!raw) {
    throw new Error(
      "TEST_ACCOUNTS または TEST_ACCOUNTS_FILE 環境変数を設定してください。"
    );
  }

  return raw.split(",").map((pair) => {
    const [email, ...rest] = pair.split(":");
    return { email: email.trim(), password: rest.join(":").trim() };
  });
}

async function fetchSessionToken(account: Account): Promise<string | null> {
  // NextAuth Credentials provider の signin フロー
  // 1. CSRF トークン取得
  const csrfRes = await fetch(`${STAGING_URL}/api/auth/csrf`);
  if (!csrfRes.ok) throw new Error(`CSRF fetch failed: ${csrfRes.status}`);
  const { csrfToken } = (await csrfRes.json()) as { csrfToken: string };

  // Set-Cookie ヘッダーから __Host-authjs.csrf-token を取得
  const csrfCookie = csrfRes.headers
    .getSetCookie()
    .find((c) => c.includes("authjs.csrf-token") || c.includes("__Host-authjs.csrf-token"));
  const csrfCookieValue = csrfCookie?.split(";")[0] ?? "";

  // 2. Credentials でサインイン
  const signinRes = await fetch(`${STAGING_URL}/api/auth/callback/staging-credentials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: csrfCookieValue,
    },
    redirect: "manual",
    body: new URLSearchParams({
      csrfToken,
      email: account.email,
      password: account.password,
      json: "true",
    }).toString(),
  });

  // 3. session-token cookie を抽出
  const setCookies = signinRes.headers.getSetCookie();
  const sessionCookie = setCookies.find(
    (c) => c.includes("authjs.session-token") || c.includes("__Secure-authjs.session-token")
  );

  if (!sessionCookie) {
    console.warn(`[warn] ${account.email}: session-token が取得できませんでした。`);
    return null;
  }

  const token = sessionCookie.split(";")[0].split("=").slice(1).join("=");
  return token;
}

async function main() {
  const accounts = loadAccounts();
  console.log(`${accounts.length} アカウントの cookie を取得します...`);

  const rows: string[] = ["email,token"];
  let success = 0;
  let failure = 0;

  for (const account of accounts) {
    try {
      const token = await fetchSessionToken(account);
      if (token) {
        rows.push(`${account.email},${token}`);
        success++;
        console.log(`[ok] ${account.email}`);
      } else {
        failure++;
      }
    } catch (err) {
      console.error(`[error] ${account.email}: ${err}`);
      failure++;
    }
  }

  writeFileSync(OUTPUT_PATH, rows.join("\n") + "\n", "utf-8");
  console.log(`\n完了: ${success} 成功 / ${failure} 失敗`);
  console.log(`出力: ${OUTPUT_PATH}`);

  if (success < accounts.length * 0.8) {
    console.error("警告: 80% 以上のアカウントで取得に失敗しました。credentials 設定を確認してください。");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
