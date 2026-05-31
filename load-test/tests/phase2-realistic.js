/**
 * Phase 2 — 現実的 500VU 同時接続テスト
 *
 * 目的: 実際のユーザー行動パターンで 500 人同時利用に耐えられるかを検証する
 *
 * シナリオ構成（合計 500 VU）:
 *   browsing (300 VU): 部屋一覧を 20〜40 秒おきに確認するだけのユーザー
 *   staying  (100 VU): 入室して 10〜20 分滞在するユーザー
 *   cycling  (100 VU): 部屋探し → 入室 → 2〜5 分滞在 → 退室を繰り返すユーザー
 *
 * 想定 RPS: ~16 RPS（現実的な値）
 * AC: エラー率 < 1%、P95 < 500ms
 */
import http from "k6/http";
import { check, sleep } from "k6";
import { Trend } from "k6/metrics";
import { BASE_URL, COOKIES, authHeaders } from "./config.js";

const joinDuration = new Trend("room_join_duration");
const leaveDuration = new Trend("room_leave_duration");

export const options = {
  insecureSkipTLSVerify: true,
  scenarios: {
    // 部屋一覧を眺めているユーザー（入室しない）
    browsing: {
      executor: "constant-vus",
      vus: 300,
      duration: "20m",
      exec: "browseScenario",
    },
    // 入室済みで長時間滞在するユーザー
    staying: {
      executor: "constant-vus",
      vus: 100,
      duration: "20m",
      exec: "stayScenario",
    },
    // 短サイクルで入退室を繰り返すアクティブユーザー
    cycling: {
      executor: "constant-vus",
      vus: 100,
      duration: "20m",
      exec: "cycleScenario",
    },
  },
  thresholds: {
    http_req_failed: [{ threshold: "rate<0.01", abortOnFail: false }],
    http_req_duration: [
      { threshold: "p(95)<500", abortOnFail: false },
      { threshold: "p(99)<1000", abortOnFail: false },
    ],
    room_join_duration: [{ threshold: "p(95)<500", abortOnFail: false }],
    room_leave_duration: [{ threshold: "p(95)<500", abortOnFail: false }],
  },
};

export function setup() {
  const headers = authHeaders(COOKIES[0].token);
  const roomIds = [];

  for (let page = 1; page <= 10; page++) {
    const res = http.get(
      `${BASE_URL}/api/v1/rooms?status=waiting&limit=100&page=${page}`,
      { headers }
    );
    if (res.status !== 200) break;
    const data = res.json("data");
    if (!data || data.length === 0) break;
    const filtered = data.filter((r) => r.maxPlayers < 16).map((r) => r.id);
    roomIds.push(...filtered);
    if (data.length < 100) break;
  }

  console.log(`Setup: ${roomIds.length} 部屋を取得`);
  return { roomIds };
}

// ─── シナリオ1: ルーム一覧を眺めるだけのユーザー ──────────────────────────────
export function browseScenario() {
  const { token } = COOKIES[(__VU - 1) % COOKIES.length];
  const headers = authHeaders(token);

  const healthRes = http.get(`${BASE_URL}/api/v1/health`);
  check(healthRes, { "browse: health 200": (r) => r.status === 200 });

  const roomsRes = http.get(`${BASE_URL}/api/v1/rooms?status=waiting`, { headers });
  check(roomsRes, { "browse: rooms 200": (r) => r.status === 200 });

  // 実ユーザーは 20〜40 秒おきにページを確認する
  sleep(Math.random() * 20 + 20);
}

// ─── シナリオ2: 入室して長時間滞在するユーザー ───────────────────────────────
export function stayScenario(data) {
  const { token } = COOKIES[(__VU - 1) % COOKIES.length];
  const headers = authHeaders(token);
  const roomId = data.roomIds[(__VU - 1) % data.roomIds.length];

  // 入室
  const t0 = Date.now();
  const joinRes = http.post(`${BASE_URL}/api/v1/rooms/${roomId}/join`, null, { headers });
  joinDuration.add(Date.now() - t0);
  check(joinRes, { "stay: join ok": (r) => r.status === 200 || r.status === 409 });

  if (joinRes.status === 200) {
    // 10〜20 分滞在。その間 60〜120 秒ごとにヘルスチェックのみ
    const stayUntil = Date.now() + (Math.random() * 600 + 600) * 1000;
    while (Date.now() < stayUntil) {
      sleep(Math.random() * 60 + 60);
      if (Date.now() >= stayUntil) break;
      const r = http.get(`${BASE_URL}/api/v1/health`);
      check(r, { "stay: health 200": (r) => r.status === 200 });
    }

    // 退室
    const t1 = Date.now();
    const leaveRes = http.post(`${BASE_URL}/api/v1/rooms/${roomId}/leave`, null, { headers });
    leaveDuration.add(Date.now() - t1);
    check(leaveRes, { "stay: leave 204": (r) => r.status === 204 });
  }

  // 次のサイクルまで 30〜60 秒待機
  sleep(Math.random() * 30 + 30);
}

// ─── シナリオ3: 短サイクルで入退室を繰り返すユーザー ──────────────────────────
export function cycleScenario(data) {
  const { token } = COOKIES[(__VU - 1) % COOKIES.length];
  const headers = authHeaders(token);
  const roomId = data.roomIds[(__VU - 1) % data.roomIds.length];

  // まず部屋一覧を確認（リアルな行動）
  const roomsRes = http.get(`${BASE_URL}/api/v1/rooms?status=waiting`, { headers });
  check(roomsRes, { "cycle: rooms 200": (r) => r.status === 200 });

  // 15〜45 秒ブラウジングしてから入室
  sleep(Math.random() * 30 + 15);

  const t0 = Date.now();
  const joinRes = http.post(`${BASE_URL}/api/v1/rooms/${roomId}/join`, null, { headers });
  joinDuration.add(Date.now() - t0);
  check(joinRes, { "cycle: join ok": (r) => r.status === 200 || r.status === 409 });

  if (joinRes.status === 200) {
    // 約 5 分滞在（4〜6 分）
    sleep(Math.random() * 120 + 240);

    const t1 = Date.now();
    const leaveRes = http.post(`${BASE_URL}/api/v1/rooms/${roomId}/leave`, null, { headers });
    leaveDuration.add(Date.now() - t1);
    check(leaveRes, { "cycle: leave 204": (r) => r.status === 204 });
  } else {
    // 満員なら少し待ってリトライ
    sleep(Math.random() * 60 + 30);
  }
}
