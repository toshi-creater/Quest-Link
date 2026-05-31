/**
 * Phase 2 — 切り分けテスト: VU起動を段階的にずらした版
 *
 * 仮説: テスト開始時に500VUが一斉に接続しようとする「バースト」が
 *       TCP accept キューを溢れさせてタイムアウトを引き起こしている
 *
 * 検証方法:
 *   - 各シナリオを1分ずつずらして起動（constant-vus → ramping-vus）
 *   - browsing: 0分〜 3分かけて300VUに増加
 *   - staying:  1分〜 2分かけて100VUに増加
 *   - cycling:  3分〜 2分かけて100VUに増加
 *
 * 前回テスト（phase2-realistic）と比較してエラー率が下がれば
 * バーストが原因と確定できる
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
    browsing: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "3m", target: 300 },  // 3分かけて300VUへ（前回: 0秒で全員一斉起動）
        { duration: "17m", target: 300 }, // 17分維持
      ],
      exec: "browseScenario",
    },
    staying: {
      executor: "ramping-vus",
      startVUs: 0,
      startTime: "1m",                    // 1分後に起動開始
      stages: [
        { duration: "2m", target: 100 },  // 2分かけて100VUへ
        { duration: "19m", target: 100 }, // 維持
      ],
      exec: "stayScenario",
    },
    cycling: {
      executor: "ramping-vus",
      startVUs: 0,
      startTime: "3m",                    // 3分後に起動開始
      stages: [
        { duration: "2m", target: 100 },  // 2分かけて100VUへ
        { duration: "17m", target: 100 }, // 維持
      ],
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

export function browseScenario() {
  const { token } = COOKIES[(__VU - 1) % COOKIES.length];
  const headers = authHeaders(token);
  const healthRes = http.get(`${BASE_URL}/api/v1/health`);
  check(healthRes, { "browse: health 200": (r) => r.status === 200 });
  const roomsRes = http.get(`${BASE_URL}/api/v1/rooms?status=waiting`, { headers });
  check(roomsRes, { "browse: rooms 200": (r) => r.status === 200 });
  sleep(Math.random() * 20 + 20);
}

export function stayScenario(data) {
  const { token } = COOKIES[(__VU - 1) % COOKIES.length];
  const headers = authHeaders(token);
  const roomId = data.roomIds[(__VU - 1) % data.roomIds.length];

  const t0 = Date.now();
  const joinRes = http.post(`${BASE_URL}/api/v1/rooms/${roomId}/join`, null, { headers });
  joinDuration.add(Date.now() - t0);
  check(joinRes, { "stay: join ok": (r) => r.status === 200 || r.status === 409 });

  if (joinRes.status === 200) {
    const stayUntil = Date.now() + (Math.random() * 600 + 600) * 1000;
    while (Date.now() < stayUntil) {
      sleep(Math.random() * 60 + 60);
      if (Date.now() >= stayUntil) break;
      const r = http.get(`${BASE_URL}/api/v1/health`);
      check(r, { "stay: health 200": (r) => r.status === 200 });
    }
    const t1 = Date.now();
    const leaveRes = http.post(`${BASE_URL}/api/v1/rooms/${roomId}/leave`, null, { headers });
    leaveDuration.add(Date.now() - t1);
    check(leaveRes, { "stay: leave 204": (r) => r.status === 204 });
  }
  sleep(Math.random() * 30 + 30);
}

export function cycleScenario(data) {
  const { token } = COOKIES[(__VU - 1) % COOKIES.length];
  const headers = authHeaders(token);
  const roomId = data.roomIds[(__VU - 1) % data.roomIds.length];

  const roomsRes = http.get(`${BASE_URL}/api/v1/rooms?status=waiting`, { headers });
  check(roomsRes, { "cycle: rooms 200": (r) => r.status === 200 });
  sleep(Math.random() * 30 + 15);

  const t0 = Date.now();
  const joinRes = http.post(`${BASE_URL}/api/v1/rooms/${roomId}/join`, null, { headers });
  joinDuration.add(Date.now() - t0);
  check(joinRes, { "cycle: join ok": (r) => r.status === 200 || r.status === 409 });

  if (joinRes.status === 200) {
    sleep(Math.random() * 120 + 240);
    const t1 = Date.now();
    const leaveRes = http.post(`${BASE_URL}/api/v1/rooms/${roomId}/leave`, null, { headers });
    leaveDuration.add(Date.now() - t1);
    check(leaveRes, { "cycle: leave 204": (r) => r.status === 204 });
  } else {
    sleep(Math.random() * 60 + 30);
  }
}
