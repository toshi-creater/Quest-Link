export type RoomStatus = "waiting" | "playing" | "closed";

export type StatusConfig = {
  label: string;
  bg: string;
  color: string;
  border: string;
};

export const roomStatusConfig: Record<RoomStatus, StatusConfig> = {
  waiting: { label: "募集中", bg: "rgba(34,197,94,0.15)", color: "#22c55e", border: "rgba(34,197,94,0.3)" },
  playing: { label: "プレイ中", bg: "rgba(234,179,8,0.15)", color: "#eab308", border: "rgba(234,179,8,0.3)" },
  closed: { label: "終了", bg: "rgba(100,100,120,0.15)", color: "#8888aa", border: "rgba(100,100,120,0.3)" },
};

export const fallbackStatusConfig: StatusConfig = {
  label: "不明",
  bg: "rgba(100,100,120,0.15)",
  color: "#8888aa",
  border: "rgba(100,100,120,0.3)",
};
