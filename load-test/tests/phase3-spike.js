/**
 * Phase 3 — スパイクテスト
 * 目的: 急激な VU 増加（10→500 を 30 秒で）への耐性確認
 * AC: スパイク後 30 秒以内に P95 < 1000ms に回復すること
 */
import http from "k6/http";
import { check, sleep } from "k6";
import { Trend } from "k6/metrics";
import { BASE_URL, COOKIES, authHeaders } from "./config.js";

const recoveryDuration = new Trend("spike_recovery_p95");

export const options = {
  stages: [
    { duration: "1m", target: 10 },   // 通常負荷ベースライン
    { duration: "30s", target: 500 }, // スパイク（30秒で急増）
    { duration: "3m", target: 500 },  // スパイク維持（回復を観察）
    { duration: "30s", target: 10 },  // 急減
    { duration: "2m", target: 10 },   // 安定確認
    { duration: "1m", target: 0 },    // クールダウン
  ],
  thresholds: {
    http_req_failed: [{ threshold: "rate<0.05", abortOnFail: false }], // スパイク中は 5% まで許容
    http_req_duration: [
      { threshold: "p(95)<1000", abortOnFail: false },
    ],
    spike_recovery_p95: [{ threshold: "p(95)<1000" }],
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

export default function scenario(data) {
  const { token } = COOKIES[(__VU - 1) % COOKIES.length];
  const headers = authHeaders(token);
  const roomIds = data.roomIds;

  // 1. ヘルスチェック（スパイク中の応答確認）
  const healthRes = http.get(`${BASE_URL}/api/v1/health`);
  check(healthRes, { "health ok": (r) => r.status === 200 });

  sleep(0.1);

  // 2. 部屋一覧
  const roomsRes = http.get(`${BASE_URL}/api/v1/rooms?status=waiting`, { headers });
  check(roomsRes, { "rooms ok": (r) => r.status === 200 });

  if (!roomIds || roomIds.length === 0) {
    sleep(0.5);
    return;
  }

  // 3. VU番号で部屋を分散割当して参加・即退室（高速サイクルでスパイク負荷を再現）
  const roomId = roomIds[(__VU - 1) % roomIds.length];

  const joinStart = Date.now();
  const joinRes = http.post(
    `${BASE_URL}/api/v1/rooms/${roomId}/join`,
    null,
    { headers }
  );
  recoveryDuration.add(Date.now() - joinStart);
  check(joinRes, {
    "join success": (r) => r.status === 200 || r.status === 409,
  });

  if (joinRes.status === 200) {
    http.post(`${BASE_URL}/api/v1/rooms/${roomId}/leave`, null, { headers });
  }

  sleep(0.3);
}
