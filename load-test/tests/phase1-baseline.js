/**
 * Phase 1 — ベースライン負荷テスト
 * 目的: 通常負荷（VU 10→50→100→0）でのエラー率・レイテンシの基準値を測定する
 */
import http from "k6/http";
import { check, sleep } from "k6";
import { BASE_URL, THRESHOLDS, getCookieForVU, authHeaders } from "./config.js";

export const options = {
  stages: [
    { duration: "2m", target: 10 },    // ウォームアップ
    { duration: "3m", target: 50 },   // 中間負荷
    { duration: "3m", target: 100 },   // 最大ベースライン
    { duration: "2m", target: 0 },    // クールダウン
  ],
  thresholds: THRESHOLDS,
};

export default function scenario() {
  const { token } = getCookieForVU();
  const headers = authHeaders(token);

  // 1. ヘルスチェック
  const healthRes = http.get(`${BASE_URL}/api/v1/health`);
  check(healthRes, { "health 200": (r) => r.status === 200 });

  sleep(0.5);

  // 2. 部屋一覧取得
  const roomsRes = http.get(
    `${BASE_URL}/api/v1/rooms?vacant=true`,
    { headers }
  );
  check(roomsRes, { "rooms 200": (r) => r.status === 200 });

  const rooms = roomsRes.json("data");
  if (!rooms || rooms.length === 0) {
    sleep(1);
    return;
  }

  // 3. ランダムな部屋に参加
  const room = rooms[Math.floor(Math.random() * rooms.length)];
  const joinRes = http.post(
    `${BASE_URL}/api/v1/rooms/${room.id}/join`,
    null,
    { headers }
  );
  check(joinRes, {
    "join 200 or 409": (r) => r.status === 200 || r.status === 409,
  });

  sleep(2);

  // 4. 退室
  if (joinRes.status === 200) {
    const leaveRes = http.post(
      `${BASE_URL}/api/v1/rooms/${room.id}/leave`,
      null,
      { headers }
    );
    check(leaveRes, { "leave 204": (r) => r.status === 204 });
  }

  sleep(1);
}
