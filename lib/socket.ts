import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:3001", {
      withCredentials: true,
      autoConnect: false,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      transports: ["websocket"],
    });
  }
  return socket;
}

export async function connectSocket(): Promise<void> {
  const s = getSocket();
  try {
    const res = await fetch("/api/v1/auth/socket-token");
    if (res.ok) {
      const data = (await res.json()) as { token: string };
      s.auth = { token: data.token };
    }
  } catch {
    // フォールバック: Cookieベース認証で接続
  }
  s.connect();
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}
