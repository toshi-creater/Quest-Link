/**
 * Phase 1 — ベースライン負荷テスト
 * 目的: 通常負荷（VU 10→50→100→0）でのエラー率・レイテンシの基準値を測定する
 *
 * シナリオ:
 *   - VU = ジョイナー (loadtest+1〜100 のcookieを使用)
 *   - ホストユーザー (loadtest+101〜300) は各部屋にずっと在室
 *   - 各VUはVU番号で決まった部屋に繰り返し入退室する
 */
import http from "k6/http";
import { check, sleep } from "k6";
import { BASE_URL, THRESHOLDS, COOKIES, authHeaders } from "./config.js";

export const options = {
  stages: [
    { duration: "2m", target: 10 },  // ウォームアップ
    { duration: "3m", target: 50 },  // 中間負荷
    { duration: "3m", target: 100 }, // 最大ベースライン
    { duration: "2m", target: 0 },   // クールダウン
  ],
  thresholds: THRESHOLDS,
};

// テスト開始前に全部屋IDを一括取得（全VUで共有）
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
    // phase6用のmaxPlayers=16部屋はフェーズ1の対象外として除外
    const filtered = data.filter((r) => r.maxPlayers < 16).map((r) => r.id);
    roomIds.push(...filtered);
    if (data.length < 100) break;
  }

  console.log(`Setup: ${roomIds.length} 部屋を取得`);
  return { roomIds };
}

export default function scenario(data) {
  // ジョイナーcookieを使用（VU番号でラウンドロビン）
  const { token } = COOKIES[(__VU - 1) % COOKIES.length];
  const headers = authHeaders(token);
  const roomIds = data.roomIds;

  if (!roomIds || roomIds.length === 0) {
    sleep(1);
    return;
  }

  // 1. ヘルスチェック
  const healthRes = http.get(`${BASE_URL}/api/v1/health`);
  check(healthRes, { "health 200": (r) => r.status === 200 });

  sleep(0.5);

  // 2. 部屋一覧取得（リアルなユーザー行動の再現）
  const roomsRes = http.get(
    `${BASE_URL}/api/v1/rooms?status=waiting&limit=100`,
    { headers }
  );
  check(roomsRes, { "rooms 200": (r) => r.status === 200 });

  // 3. VU番号で部屋を固定割当（競合ゼロ）
  const roomId = roomIds[(__VU - 1) % roomIds.length];

  const joinRes = http.post(
    `${BASE_URL}/api/v1/rooms/${roomId}/join`,
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
      `${BASE_URL}/api/v1/rooms/${roomId}/leave`,
      null,
      { headers }
    );
    check(leaveRes, { "leave 204": (r) => r.status === 204 });
  }

  sleep(1);
}
