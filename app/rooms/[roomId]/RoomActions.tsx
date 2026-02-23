"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { DoorOpen, LogOut, Trash2 } from "lucide-react";

type Props = {
  roomId: string;
  isParticipant: boolean;
  isHost: boolean;
  status: "waiting" | "playing" | "closed";
};

export function RoomActions({ roomId, isParticipant, isHost, status }: Props) {
  const router = useRouter();

  if (status === "closed") {
    return (
      <div
        className="rounded-xl border px-5 py-4 text-center text-sm"
        style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)", color: "var(--text-muted)" }}
      >
        この部屋は終了しました
      </div>
    );
  }

  if (!isParticipant) {
    return (
      <button
        onClick={() => router.push(`/rooms/${roomId}`)}
        className="flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold text-white transition-all hover:opacity-90"
        style={{
          background: "linear-gradient(135deg, var(--accent), #6d28d9)",
          boxShadow: "0 4px 14px rgba(124,58,237,0.4)",
        }}
      >
        <DoorOpen className="h-4 w-4" />
        参加する
      </button>
    );
  }

  return (
    <div className="flex gap-3">
      <Link
        href={`/rooms/${roomId}/ratings`}
        className="flex flex-1 items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-all hover:opacity-80"
        style={{
          borderColor: "var(--border)",
          color: "var(--text-secondary)",
          backgroundColor: "var(--bg-card)",
        }}
      >
        <LogOut className="h-4 w-4" />
        退室する
      </Link>
      {isHost && (
        <button
          onClick={() => router.push(`/rooms/${roomId}/ratings`)}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-500/30 px-4 py-3 text-sm font-medium text-red-400 transition-all hover:bg-red-500/10"
          style={{ backgroundColor: "rgba(239,68,68,0.05)" }}
        >
          <Trash2 className="h-4 w-4" />
          解散する
        </button>
      )}
    </div>
  );
}
