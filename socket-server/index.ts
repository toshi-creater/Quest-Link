import dotenv from "dotenv";
// .env.local（シークレット）→ .env の順に読み込む
// 本番環境（Railway等）ではプラットフォームが env を注入するため何もしない
dotenv.config({ path: ".env.local" });
dotenv.config();

import { createServer } from "http";
import type { IncomingMessage, ServerResponse } from "http";
import { Server as SocketIOServer } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import Redis from "ioredis";
import { decode } from "next-auth/jwt";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

type AuthenticatedSocketData =
  | { kind: "user"; userId: string; username: string; iconUrl: string | null; avgRating: number }
  | { kind: "guest"; guestSessionId: string; displayName: string };

const GUEST_ID_RE = /^guest_[0-9a-f]{32}$/;

const REDIS_URL = process.env.REDIS_URL;
if (!REDIS_URL) {
  console.error("REDIS_URL is not set. Exiting.");
  process.exit(1);
}

const pubClient = new Redis(REDIS_URL);
const subClient = pubClient.duplicate();

pubClient.on("error", (err) => console.error("Redis pubClient error:", err));
subClient.on("error", (err) => console.error("Redis subClient error:", err));

const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 3 });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const PORT = parseInt(process.env.SOCKET_PORT ?? "3001", 10);
const NEXT_APP_URL = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
const INTERNAL_SECRET = process.env.SOCKET_INTERNAL_SECRET;

function parseCookies(cookieHeader: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const pair of cookieHeader.split(";")) {
    const [key, ...values] = pair.trim().split("=");
    if (key) {
      result[key.trim()] = decodeURIComponent(values.join("=").trim());
    }
  }
  return result;
}

async function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk: Buffer) => {
      body += chunk.toString();
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

// HTTPサーバーを先に作成し、後でリクエストハンドラーを追加することで
// io インスタンスをハンドラー内で参照できるようにする
const httpServer = createServer();

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: NEXT_APP_URL,
    credentials: true,
  },
});

io.adapter(createAdapter(pubClient, subClient));

// Next.js APIルートからSocket.IOイベントを emit するための内部エンドポイント
httpServer.on("request", async (req: IncomingMessage, res: ServerResponse) => {
  if (req.method === "POST" && req.url === "/internal/emit") {
    if (INTERNAL_SECRET) {
      const provided = req.headers["x-internal-secret"];
      if (provided !== INTERNAL_SECRET) {
        res.writeHead(403, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Forbidden" }));
        return;
      }
    }

    try {
      const body = await readBody(req);
      const { event, roomId, data } = JSON.parse(body) as {
        event: string;
        roomId: string;
        data: Record<string, unknown>;
      };

      io.to(roomId).emit(event, data);

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true }));
    } catch {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Bad Request" }));
    }
    return;
  }

  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200);
    res.end("OK");
    return;
  }

  res.writeHead(404);
  res.end("Not Found");
});

// 認証ミドルウェア: トークン認証（クロスドメイン対応）→ Cookieフォールバックの順で検証
// トークン認証: socket.handshake.auth.token（socket-auth salt の短命JWT）
// Cookie認証: authjs.session-token / ゲスト: quest_link_guest_session
io.use(async (socket, next) => {
  try {
    // 1. トークンベース認証（本番クロスドメイン環境向け）
    const authToken = socket.handshake.auth?.token as string | undefined;
    if (authToken) {
      const decoded = await decode({
        token: authToken,
        secret: process.env.AUTH_SECRET ?? "",
        salt: "socket-auth",
      });

      if (decoded?.userId) {
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId as string },
          select: { id: true, username: true, iconUrl: true, avgRating: true },
        });

        if (user) {
          socket.data = {
            kind: "user",
            userId: user.id,
            username: user.username,
            iconUrl: user.iconUrl,
            avgRating: user.avgRating,
          } satisfies AuthenticatedSocketData;
          return next();
        }
      }

      if (decoded?.guestSessionId) {
        const tokenGuestId = decoded.guestSessionId as string;
        if (GUEST_ID_RE.test(tokenGuestId)) {
          const guest = await prisma.guest.findUnique({
            where: { guestSessionId: tokenGuestId },
            select: { displayName: true },
          });
          if (guest) {
            socket.data = {
              kind: "guest",
              guestSessionId: tokenGuestId,
              displayName: guest.displayName,
            } satisfies AuthenticatedSocketData;
            return next();
          }
        }
      }
    }

    // 2. Cookieベース認証（ローカル開発フォールバック）
    const cookieHeader = socket.request.headers.cookie ?? "";
    const cookies = parseCookies(cookieHeader);
    const cookieName =
      process.env.NODE_ENV === "production"
        ? "__Secure-authjs.session-token"
        : "authjs.session-token";
    const sessionToken = cookies[cookieName];

    if (sessionToken) {
      const decoded = await decode({
        token: sessionToken,
        secret: process.env.AUTH_SECRET ?? "",
        salt: cookieName,
      });

      if (decoded?.userId) {
        socket.data = {
          kind: "user",
          userId: decoded.userId as string,
          username: (decoded.username as string | undefined) ?? "",
          iconUrl: (decoded.iconUrl as string | null | undefined) ?? null,
          avgRating: (decoded.avgRating as number | undefined) ?? 0,
        } satisfies AuthenticatedSocketData;
        return next();
      }
    }

    // ゲストセッション Cookie によるフォールバック認証
    const guestSessionId = cookies["quest_link_guest_session"] ?? "";
    if (!GUEST_ID_RE.test(guestSessionId)) {
      return next(new Error("UNAUTHORIZED"));
    }

    const participant = await prisma.roomParticipant.findFirst({
      where: { guestSessionId, leftAt: null },
      select: { id: true },
    });
    if (!participant) {
      return next(new Error("UNAUTHORIZED"));
    }

    const guest = await prisma.guest.findUnique({
      where: { guestSessionId },
      select: { displayName: true },
    });
    if (!guest) {
      return next(new Error("UNAUTHORIZED"));
    }

    socket.data = {
      kind: "guest",
      guestSessionId,
      displayName: guest.displayName,
    } satisfies AuthenticatedSocketData;
    next();
  } catch {
    next(new Error("UNAUTHORIZED"));
  }
});

io.on("connection", (socket) => {
  const socketData = socket.data as AuthenticatedSocketData;

  // クライアント → サーバー: 部屋チャンネルに参加（REST /join 後に送信）
  // 通知・システムメッセージは REST /join ハンドラが担う
  socket.on("room:join", ({ roomId }: { roomId: string }) => {
    if (typeof roomId !== "string" || !roomId) return;
    socket.join(roomId);
  });

  // クライアント → サーバー: 部屋チャンネルから退出（REST /leave 後に送信）
  // 通知・システムメッセージは REST /leave ハンドラが担う
  socket.on("room:leave", ({ roomId }: { roomId: string }) => {
    if (typeof roomId !== "string" || !roomId) return;
    socket.leave(roomId);
  });

  // クライアント → サーバー: チャットメッセージを送信
  socket.on(
    "chat:send",
    async ({ roomId, content }: { roomId: string; content: string }) => {
      if (
        typeof roomId !== "string" ||
        !roomId ||
        typeof content !== "string" ||
        !content.trim()
      )
        return;

      try {
        if (socketData.kind === "user") {
          const message = await prisma.chatMessage.create({
            data: {
              roomId,
              userId: socketData.userId,
              content: content.trim(),
              isSystem: false,
            },
            include: {
              user: {
                select: { id: true, username: true, iconUrl: true },
              },
            },
          });

          io.to(roomId).emit("chat:message", {
            id: message.id,
            roomId: message.roomId,
            user: message.user
              ? {
                  id: message.user.id,
                  username: message.user.username,
                  iconUrl: message.user.iconUrl,
                }
              : null,
            content: message.content,
            isSystem: false,
            createdAt: message.createdAt,
          });
        } else {
          // ゲスト: 送信対象ルームへの参加を確認してから保存
          const participant = await prisma.roomParticipant.findFirst({
            where: { guestSessionId: socketData.guestSessionId, roomId, leftAt: null },
            select: { id: true },
          });
          if (!participant) return;

          const guest = await prisma.guest.findUnique({
            where: { guestSessionId: socketData.guestSessionId },
            select: { id: true },
          });
          if (!guest) return;

          const message = await prisma.chatMessage.create({
            data: {
              roomId,
              userId: null,
              guestId: guest.id,
              content: content.trim(),
              isSystem: false,
            },
          });

          io.to(roomId).emit("chat:message", {
            id: message.id,
            roomId: message.roomId,
            user: null,
            displayName: socketData.displayName,
            guestSessionId: socketData.guestSessionId,
            content: message.content,
            isSystem: false,
            createdAt: message.createdAt,
          });
        }
      } catch (err) {
        console.error("Error in chat:send handler:", err);
      }
    }
  );
});

httpServer.listen(PORT, () => {
  console.log(`> Socket.IO server ready on http://localhost:${PORT}`);
});
