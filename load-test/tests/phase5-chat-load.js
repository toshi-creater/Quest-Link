/**
 * Phase 5 — WebSocket チャット同時送信スモークテスト
 * 目的: 100 VU が 25 部屋（4 VU/部屋）に分散して 10 秒間隔でチャットを
 *       送信し続けても socket-server / Redis / DB が崩れないかを検証する
 * AC:
 *   - ws_connect_success > 99%
 *   - http_req_failed < 1%（socket-token 取得エラー）
 *   - recv/sent 比が 4 前後（fan-out ロストがないこと）
 */
import http from "k6/http";
import { check } from "k6";
import ws from "k6/ws";
import { Counter, Rate } from "k6/metrics";
import { BASE_URL, WS_URL, getCookieForVU, COOKIES, authHeaders } from "./config.js";

const wsConnected = new Counter("ws_connected");
const wsDisconnected = new Counter("ws_disconnected");
const chatSent = new Counter("chat_sent");
const chatReceived = new Counter("chat_received");
const wsConnectSuccess = new Rate("ws_connect_success");

export const options = {
  stages: [
    { duration: "30s", target: 100 },
    { duration: "5m", target: 100 },
    { duration: "30s", target: 0 },
  ],
  thresholds: {
    ws_connect_success: [{ threshold: "rate>0.99" }],
    http_req_failed: [{ threshold: "rate<0.01" }],
  },
};

// Socket.IO EIO=4 プロトコル定数
const EIO_PING = "2";
const EIO_PONG = "3";
const SIO_CONNECT = "40";
const SIO_EVENT = "42";

function buildSioEvent(event, payload) {
  return `${SIO_EVENT}["${event}",${JSON.stringify(payload)}]`;
}

export function setup() {
  const { token } = COOKIES[0];
  const res = http.get(`${BASE_URL}/api/v1/rooms?status=waiting&limit=100`, {
    headers: authHeaders(token),
  });
  const rooms = res.json("data");
  if (!rooms || rooms.length < 25) {
    throw new Error(
      "テスト用部屋が不足しています（25件以上必要）。pnpm db:seed:load を実行してください。"
    );
  }
  // maxPlayers=16 の phase6 用部屋を除外し、25 部屋に分散（100 VU ÷ 25 部屋 = 4 VU/部屋）
  const roomIds = rooms.filter((r) => r.maxPlayers < 16).slice(0, 25).map((r) => r.id);
  return { roomIds };
}

export default function scenario(data) {
  const { roomIds } = data;
  const roomId = roomIds[(__VU - 1) % roomIds.length];
  const { token } = getCookieForVU();

  // 1. socket-auth 短命 JWT を取得
  const tokenRes = http.get(`${BASE_URL}/api/v1/auth/socket-token`, {
    headers: authHeaders(token),
  });
  const socketToken = tokenRes.status === 200 ? tokenRes.json("token") : null;

  // 2. Socket.IO WebSocket に直接接続（EIO=4 / transport=websocket）
  const wsEndpoint = `${WS_URL}/socket.io/?EIO=4&transport=websocket`;

  const res = ws.connect(
    wsEndpoint,
    {
      headers: {
        Cookie: `__Secure-authjs.session-token=${token}`,
      },
    },
    function (socket) {
      let connected = false;
      let chatInterval = null;

      socket.on("open", () => {
        wsConnected.add(1);
        wsConnectSuccess.add(true);

        const connectPayload = socketToken
          ? `${SIO_CONNECT}{"token":"${socketToken}"}`
          : SIO_CONNECT;
        socket.send(connectPayload);
      });

      socket.on("message", (msg) => {
        if (!msg) return;

        if (msg === EIO_PING) {
          socket.send(EIO_PONG);
          return;
        }

        if (msg.startsWith(SIO_CONNECT)) {
          if (!connected) {
            connected = true;
            socket.send(buildSioEvent("room:join", { roomId }));

            // 10 秒ごとに chat:send を送信（phase4 の 30 秒より高頻度）
            chatInterval = socket.setInterval(() => {
              socket.send(
                buildSioEvent("chat:send", {
                  roomId,
                  content: `k6 phase5 from VU${__VU} at ${Date.now()}`,
                })
              );
              chatSent.add(1);
            }, 10000);
          }
          return;
        }

        if (msg.startsWith(SIO_EVENT)) {
          try {
            const payload = JSON.parse(msg.slice(2));
            if (Array.isArray(payload) && payload[0] === "chat:message") {
              chatReceived.add(1);
            }
          } catch {
            // ignore parse errors
          }
        }
      });

      socket.on("error", (e) => {
        wsConnectSuccess.add(false);
        console.error(`VU${__VU} WS error: ${e}`);
      });

      socket.on("close", () => {
        wsDisconnected.add(1);
        if (chatInterval) socket.clearInterval(chatInterval);
      });

      // テスト終了前に退室して切断（6分）
      socket.setTimeout(() => {
        socket.send(buildSioEvent("room:leave", { roomId }));
        socket.close();
      }, 360000);
    }
  );

  check(res, { "ws status 101": (r) => r && r.status === 101 });
}
