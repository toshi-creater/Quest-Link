import dotenv from "dotenv";
// .env.local（シークレット）→ .env の順に読み込む
// 本番環境（Railway等）ではプラットフォームが env を注入するため何もしない
dotenv.config({ path: ".env.local" });
dotenv.config();

import { createServer } from "http";
import type { IncomingMessage, ServerResponse } from "http";
import { Server as SocketIOServer } from "socket.io";
import { decode } from "next-auth/jwt";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

interface AuthenticatedSocketData {
  userId: string;
  username: string;
  iconUrl: string | null;
  avgRating: number;
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
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

// 認証ミドルウェア: セッションCookieを検証し未認証接続を拒否する
io.use(async (socket, next) => {
  try {
    const cookieHeader = socket.request.headers.cookie ?? "";
    const cookies = parseCookies(cookieHeader);
    const cookieName =
      process.env.NODE_ENV === "production"
        ? "__Secure-authjs.session-token"
        : "authjs.session-token";
    const sessionToken = cookies[cookieName];

    if (!sessionToken) {
      return next(new Error("UNAUTHORIZED"));
    }

    const decoded = await decode({
      token: sessionToken,
      secret: process.env.AUTH_SECRET ?? "",
      salt: cookieName,
    });

    if (!decoded?.userId) {
      return next(new Error("UNAUTHORIZED"));
    }

    socket.data.userId = decoded.userId as string;
    socket.data.username = (decoded.username as string | undefined) ?? "";
    socket.data.iconUrl = (decoded.iconUrl as string | null | undefined) ?? null;
    socket.data.avgRating = (decoded.avgRating as number | undefined) ?? 0;

    next();
  } catch {
    next(new Error("UNAUTHORIZED"));
  }
});

io.on("connection", (socket) => {
  const { userId } = socket.data as AuthenticatedSocketData;

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
        const message = await prisma.chatMessage.create({
          data: {
            roomId,
            userId,
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
      } catch (err) {
        console.error("Error in chat:send handler:", err);
      }
    }
  );
});

httpServer.listen(PORT, () => {
  console.log(`> Socket.IO server ready on http://localhost:${PORT}`);
});
