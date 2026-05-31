/**
 * Phase 2 — ピーク負荷テスト
 * 目的: ピーク RPS 50 / 同時接続 500 の耐性確認（10分間維持）
 * AC: エラー率 < 1%、P95 < 500ms
 */
import http from "k6/http";
import { check, sleep } from "k6";
import { Trend } from "k6/metrics";
import { BASE_URL, THRESHOLDS, COOKIES, authHeaders } from "./config.js";

const roomJoinDuration = new Trend("room_join_duration");
const roomLeaveDuration = new Trend("room_leave_duration");

export const options = {
  stages: [
    { duration: "2m", target: 100 },  // ウォームアップ
    { duration: "3m", target: 300 },  // 段階的増加
    { duration: "3m", target: 500 },  // ピーク到達
    { duration: "10m", target: 500 }, // ピーク維持（10分）
    { duration: "2m", target: 0 },    // クールダウン
  ],
  thresholds: {
    ...THRESHOLDS,
    room_join_duration: [{ threshold: "p(95)<500" }],
    room_leave_duration: [{ threshold: "p(95)<500" }],
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

  // 1. ヘルスチェック
  const healthRes = http.get(`${BASE_URL}/api/v1/health`);
  check(healthRes, { "health 200": (r) => r.status === 200 });

  sleep(0.2);

  // 2. 部屋一覧取得（複数クエリパラメータでリアルな負荷を再現）
  const style = ["casual", "ranked", "practice"][__VU % 3];
  const roomsRes = http.get(
    `${BASE_URL}/api/v1/rooms?status=waiting&tagSlugs=${style}`,
    { headers }
  );
  check(roomsRes, { "rooms 200": (r) => r.status === 200 });

  if (!roomIds || roomIds.length === 0) {
    sleep(0.5);
    return;
  }

  // 3. VU番号で部屋を分散割当して参加
  const roomId = roomIds[(__VU - 1) % roomIds.length];
  const joinStart = Date.now();
  const joinRes = http.post(
    `${BASE_URL}/api/v1/rooms/${roomId}/join`,
    null,
    { headers }
  );
  roomJoinDuration.add(Date.now() - joinStart);
  check(joinRes, {
    "join success": (r) => r.status === 200 || r.status === 409,
  });

  sleep(1);

  // 4. 退室
  if (joinRes.status === 200) {
    const leaveStart = Date.now();
    const leaveRes = http.post(
      `${BASE_URL}/api/v1/rooms/${roomId}/leave`,
      null,
      { headers }
    );
    roomLeaveDuration.add(Date.now() - leaveStart);
    check(leaveRes, { "leave 204": (r) => r.status === 204 });
  }

  sleep(0.5);
}
