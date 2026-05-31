/**
 * Phase 2 — VU上限探索テスト
 * 目的: 100〜500 VU をステップアップしてサービスが耐えられる上限を特定する
 * 方法: 各ステップを3分維持し、エラー率・レイテンシが閾値を超えた地点が破綻点
 * AC: エラー率 < 3%、P95 < 1000ms
 */
import http from "k6/http";
import { check, sleep } from "k6";
import { Trend } from "k6/metrics";
import { BASE_URL, COOKIES, authHeaders } from "./config.js";

const roomJoinDuration = new Trend("room_join_duration");
const roomLeaveDuration = new Trend("room_leave_duration");

// VU ごとの状態（イテレーション間で引き継がれる）
const vuState = {};

function leaveRoom(roomId, headers) {
  const leaveStart = Date.now();
  const leaveRes = http.post(
    `${BASE_URL}/api/v1/rooms/${roomId}/leave`,
    null,
    { headers }
  );
  roomLeaveDuration.add(Date.now() - leaveStart);
  const ok = leaveRes.status === 204 || leaveRes.status === 400;
  check(leaveRes, { "leave 204": (r) => r.status === 204 });
  return ok;
}

export const options = {
  insecureSkipTLSVerify: true,
  stages: [
    { duration: "1m", target: 100 }, // ウォームアップ
    { duration: "3m", target: 100 }, // Step 1: 100 VU 維持
    { duration: "1m", target: 150 }, // 増加
    { duration: "3m", target: 150 }, // Step 2: 150 VU 維持
    { duration: "1m", target: 200 }, // 増加
    { duration: "3m", target: 200 }, // Step 3: 200 VU 維持
    { duration: "1m", target: 250 }, // 増加
    { duration: "3m", target: 250 }, // Step 4: 250 VU 維持
    { duration: "1m", target: 300 }, // 増加
    { duration: "3m", target: 300 }, // Step 5: 300 VU 維持
    { duration: "1m", target: 350 }, // 増加
    { duration: "3m", target: 350 }, // Step 6: 350 VU 維持
    { duration: "1m", target: 400 }, // 増加
    { duration: "3m", target: 400 }, // Step 7: 400 VU 維持
    { duration: "1m", target: 500 }, // 増加
    { duration: "3m", target: 500 }, // Step 8: 500 VU 維持
    { duration: "2m", target: 0 },   // クールダウン
  ],
  thresholds: {
    http_req_failed: [{ threshold: "rate<0.03", abortOnFail: false }],
    http_req_duration: [
      { threshold: "p(95)<1000", abortOnFail: false },
      { threshold: "p(99)<2000", abortOnFail: false },
    ],
    room_join_duration: [{ threshold: "p(95)<1000", abortOnFail: false }],
    room_leave_duration: [{ threshold: "p(95)<1000", abortOnFail: false }],
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

  if (!vuState[__VU]) {
    vuState[__VU] = { inRoomId: null };
  }
  const state = vuState[__VU];

  // 前回イテレーションで leave が失敗していたらリトライ（最大 3 回）
  if (state.inRoomId) {
    let left = false;
    for (let i = 0; i < 3; i++) {
      if (leaveRoom(state.inRoomId, headers)) {
        left = true;
        break;
      }
      sleep(0.5);
    }
    if (left) {
      state.inRoomId = null;
    } else {
      // リトライしても退室できなければ今回のイテレーションをスキップ
      sleep(1);
      return;
    }
  }

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

  const joined = joinRes.status === 200;
  const alreadyIn = joinRes.status === 409;
  check(joinRes, {
    "join success": (r) => r.status === 200 || r.status === 409,
  });

  // 参加済み状態を記録
  if (joined || alreadyIn) {
    state.inRoomId = roomId;
  }

  sleep(1);

  // 4. 退室（失敗時は次イテレーション冒頭でリトライ）
  if (state.inRoomId) {
    if (leaveRoom(state.inRoomId, headers)) {
      state.inRoomId = null;
    }
  }

  sleep(0.5);
}
