/**
 * Socket.IOサーバー（別プロセス）へHTTP経由でイベントを emit するユーティリティ。
 * Next.js APIルートから room:host_changed / room:closed などを送信するために使用する。
 */
export async function emitToRoom(
  event: string,
  roomId: string,
  data: Record<string, unknown>
): Promise<void> {
  const socketServerUrl =
    process.env.SOCKET_SERVER_URL ?? "http://localhost:3001";
  const secret = process.env.SOCKET_INTERNAL_SECRET;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (secret) {
    headers["X-Internal-Secret"] = secret;
  }

  try {
    await fetch(`${socketServerUrl}/internal/emit`, {
      method: "POST",
      headers,
      body: JSON.stringify({ event, roomId, data }),
    });
  } catch (err) {
    // Socket.IOサーバーが起動していない場合（例: テスト環境）は警告のみ
    console.warn(`[socket-emitter] Failed to emit "${event}":`, err);
  }
}
