"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DoorOpen, LogOut, Loader2, Trash2 } from "lucide-react";
import { joinRoom, leaveRoom, closeRoom } from "@/lib/api/rooms";

type Props = {
  roomId: string;
  isParticipant: boolean;
  isHost: boolean;
  status: "waiting" | "playing" | "closed";
};

export function RoomActions({ roomId, isParticipant, isHost, status }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const joinMutation = useMutation({
    mutationFn: () => joinRoom(roomId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["room", roomId] });
      await queryClient.invalidateQueries({ queryKey: ["rooms"] });
    },
  });

  const leaveMutation = useMutation({
    mutationFn: () => leaveRoom(roomId),
    onSuccess: () => {
      router.push(`/rooms/${roomId}/ratings`);
    },
  });

  const closeMutation = useMutation({
    mutationFn: () => closeRoom(roomId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["room", roomId] });
      await queryClient.invalidateQueries({ queryKey: ["rooms"] });
      router.push("/rooms");
    },
  });

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
      <div className="flex flex-col gap-2">
        <button
          onClick={() => joinMutation.mutate()}
          disabled={joinMutation.isPending || status === "playing"}
          className="flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: "linear-gradient(135deg, var(--accent), #6d28d9)",
            boxShadow: "0 4px 14px rgba(124,58,237,0.4)",
          }}
        >
          {joinMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <DoorOpen className="h-4 w-4" />
          )}
          {status === "playing" ? "満員" : "参加する"}
        </button>
        {joinMutation.isError && (
          <p className="text-center text-xs" style={{ color: "#f87171" }}>
            {joinMutation.error.message}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-3">
        <button
          onClick={() => leaveMutation.mutate()}
          disabled={leaveMutation.isPending}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-all hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            borderColor: "var(--border)",
            color: "var(--text-secondary)",
            backgroundColor: "var(--bg-card)",
          }}
        >
          {leaveMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <LogOut className="h-4 w-4" />
          )}
          退室する
        </button>
        {isHost && (
          <button
            onClick={() => closeMutation.mutate()}
            disabled={closeMutation.isPending}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-500/30 px-4 py-3 text-sm font-medium text-red-400 transition-all hover:bg-red-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: "rgba(239,68,68,0.05)" }}
          >
            {closeMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            解散する
          </button>
        )}
      </div>
      {leaveMutation.isError && (
        <p className="text-center text-xs" style={{ color: "#f87171" }}>
          {leaveMutation.error.message}
        </p>
      )}
    </div>
  );
}
