import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server as SocketIOServer } from "socket.io";
import { decode } from "next-auth/jwt";
import { setSocketIO } from "./lib/socket";
// prisma は app.prepare() 後に dynamic import する
// （.env の読み込みが app.prepare() 内で行われるため、
//   静的 import だと DATABASE_URL が undefined のまま Pool が生成されてしまう）

interface AuthenticatedSocketData {
  userId: string;
  username: string;
  iconUrl: string | null;
  avgRating: number;
}

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT ?? "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

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

void app.prepare().then(async () => {
  // app.prepare() 完了後に .env が読み込まれているため、ここで prisma を初期化する
  const { prisma } = await import("./lib/prisma");
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url ?? "/", true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error handling request:", req.url, err);
      res.statusCode = 500;
      res.end("Internal Server Error");
    }
  });

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NEXTAUTH_URL ?? `http://${hostname}:${port}`,
      credentials: true,
    },
  });

  setSocketIO(io);

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
      socket.data.iconUrl =
        (decoded.iconUrl as string | null | undefined) ?? null;
      socket.data.avgRating = (decoded.avgRating as number | undefined) ?? 0;

      next();
    } catch {
      next(new Error("UNAUTHORIZED"));
    }
  });

  io.on("connection", (socket) => {
    const { userId, username } = socket.data as AuthenticatedSocketData;

    // クライアント → サーバー: 部屋チャンネルに参加（REST /join 後に送信）
    socket.on("room:join", async ({ roomId }: { roomId: string }) => {
      if (typeof roomId !== "string" || !roomId) return;

      try {
        socket.join(roomId);

        // 入室システムメッセージを保存してブロードキャスト
        const systemMsg = await prisma.chatMessage.create({
          data: {
            roomId,
            content: `${username}さんが入室しました`,
            isSystem: true,
          },
        });

        io.to(roomId).emit("chat:message", {
          id: systemMsg.id,
          roomId,
          user: null,
          content: systemMsg.content,
          isSystem: true,
          createdAt: systemMsg.createdAt,
        });

        // 同室の他のクライアントへ入室通知を送信
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, username: true, iconUrl: true, avgRating: true },
        });

        if (user) {
          socket.to(roomId).emit("room:user_joined", {
            userId: user.id,
            username: user.username,
            iconUrl: user.iconUrl,
            avgRating: Number(user.avgRating),
            joinedAt: new Date(),
          });
        }
      } catch (err) {
        console.error("Error in room:join handler:", err);
      }
    });

    // クライアント → サーバー: 部屋チャンネルから退出（REST /leave 後に送信）
    socket.on("room:leave", async ({ roomId }: { roomId: string }) => {
      if (typeof roomId !== "string" || !roomId) return;

      try {
        // 退室システムメッセージを保存してブロードキャスト（退出前に送信）
        const systemMsg = await prisma.chatMessage.create({
          data: {
            roomId,
            content: `${username}さんが退室しました`,
            isSystem: true,
          },
        });

        io.to(roomId).emit("chat:message", {
          id: systemMsg.id,
          roomId,
          user: null,
          content: systemMsg.content,
          isSystem: true,
          createdAt: systemMsg.createdAt,
        });

        socket.to(roomId).emit("room:user_left", {
          userId,
          username,
          leftAt: new Date(),
        });

        socket.leave(roomId);
      } catch (err) {
        console.error("Error in room:leave handler:", err);
      }
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

  httpServer.listen(port, hostname, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
