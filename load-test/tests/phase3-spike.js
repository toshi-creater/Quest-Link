/**
 * Phase 3 — スパイクテスト
 * 目的: 急激な VU 増加（10→500 を 30 秒で）への耐性確認
 * AC: スパイク後 30 秒以内に P95 < 1000ms に回復すること
 */
import http from "k6/http";
import { check, sleep } from "k6";
import { Trend } from "k6/metrics";
import { BASE_URL, getCookieForVU, authHeaders } from "./config.js";

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
      { threshold: "p(95)<1000", abortOnFail: false }, // スパイク中の P95 上限
    ],
    spike_recovery_p95: [{ threshold: "p(95)<1000" }],
  },
};

export default function scenario() {
  const { token } = getCookieForVU();
  const headers = authHeaders(token);

  // 1. ヘルスチェック（スパイク中の応答確認）
  const healthRes = http.get(`${BASE_URL}/api/v1/health`);
  check(healthRes, { "health ok": (r) => r.status === 200 });

  sleep(0.1);

  // 2. 部屋一覧
  const roomsRes = http.get(`${BASE_URL}/api/v1/rooms?vacant=true`, { headers });
  check(roomsRes, { "rooms ok": (r) => r.status === 200 });

  const rooms = roomsRes.json("data");
  if (!rooms || rooms.length === 0) {
    sleep(0.5);
    return;
  }

  // 3. 参加・即退室（高速サイクルでスパイク負荷を再現）
  const room = rooms[__VU % rooms.length];

  const joinStart = Date.now();
  const joinRes = http.post(
    `${BASE_URL}/api/v1/rooms/${room.id}/join`,
    null,
    { headers }
  );
  recoveryDuration.add(Date.now() - joinStart);
  check(joinRes, {
    "join success": (r) => r.status === 200 || r.status === 409,
  });

  if (joinRes.status === 200) {
    http.post(`${BASE_URL}/api/v1/rooms/${room.id}/leave`, null, { headers });
  }

  sleep(0.3);
}
