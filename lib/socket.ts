import type { Server } from "socket.io";

const globalForSocketIO = globalThis as unknown as {
  _io: Server | undefined;
};

export function setSocketIO(io: Server): void {
  globalForSocketIO._io = io;
}

export function getSocketIO(): Server | undefined {
  return globalForSocketIO._io;
}
