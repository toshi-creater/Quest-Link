/**
 * Phase 4 — WebSocket 耐久テスト（Socket.IO）
 * 目的: 60 分間の持続接続でメモリリーク・接続枯渇がないことを確認する
 * AC:
 *   - WS 接続成功率 > 99%
 *   - chat:message が 2 ノード双方のクライアントに届く
 *   - 60 分後にメモリリーク・接続枯渇がない（Railway メモリグラフで確認）
 *
 * 認証フロー:
 *   1. session cookie で /api/v1/auth/socket-token を呼び出し短命 JWT を取得
 *   2. WebSocket handshake の auth.token に渡す（socket サーバーの一次認証）
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
  vus: 100,
  duration: "60m",
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
  // テスト用部屋 ID を事前取得（認証が必要なため最初の cookie を使用）
  const { token } = COOKIES[0];
  const res = http.get(`${BASE_URL}/api/v1/rooms?status=waiting&limit=1`, {
    headers: authHeaders(token),
  });
  const rooms = res.json("data");
  if (!rooms || rooms.length === 0) {
    throw new Error("テスト用部屋が見つかりません。pnpm db:seed:load を実行してください。");
  }
  return { roomId: rooms[0].id };
}

export default function scenario(data) {
  const { roomId } = data;
  const { token } = getCookieForVU();

  // 1. socket-auth 短命 JWT を取得（接続直前に発行）
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

        // Socket.IO 接続確立: auth token を渡してネームスペースに接続
        const connectPayload = socketToken
          ? `${SIO_CONNECT}{"token":"${socketToken}"}`
          : SIO_CONNECT;
        socket.send(connectPayload);
      });

      socket.on("message", (msg) => {
        if (!msg) return;

        // EIO ping/pong
        if (msg === EIO_PING) {
          socket.send(EIO_PONG);
          return;
        }

        // Socket.IO 接続確認
        if (msg.startsWith(SIO_CONNECT)) {
          if (!connected) {
            connected = true;
            // 部屋に参加
            socket.send(buildSioEvent("room:join", { roomId }));

            // 30 秒ごとに chat:send を送信
            chatInterval = socket.setInterval(() => {
              socket.send(
                buildSioEvent("chat:send", {
                  roomId,
                  content: `k6 load test message from VU${__VU} at ${Date.now()}`,
                })
              );
              chatSent.add(1);
            }, 30000);
          }
          return;
        }

        // chat:message を受信
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

      // 60 分間接続を維持してから切断
      socket.setTimeout(() => {
        socket.send(buildSioEvent("room:leave", { roomId }));
        socket.close();
      }, 3600000);
    }
  );

  check(res, { "ws status 101": (r) => r && r.status === 101 });
}
