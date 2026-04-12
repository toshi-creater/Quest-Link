"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DoorOpen, SignOut, CircleNotch, Trash } from "@phosphor-icons/react";
import { joinRoom, leaveRoom, closeRoom } from "@/lib/api/rooms";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

type Props = {
  roomId: string;
  isParticipant: boolean;
  isHost: boolean;
  isGuest: boolean;
  status: "waiting" | "playing" | "closed";
  onInviteJoinClick?: () => void;
};

export function RoomActions({ roomId, isParticipant, isHost, isGuest, status, onInviteJoinClick }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

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
      if (isGuest) {
        router.push(`/rooms/${roomId}/guest-leave`);
      } else {
        router.push(`/rooms/${roomId}/ratings`);
      }
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
          onClick={onInviteJoinClick ?? (() => joinMutation.mutate())}
          disabled={joinMutation.isPending || status === "playing"}
          className="flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: "linear-gradient(135deg, var(--accent), #6d28d9)",
            boxShadow: "0 4px 14px rgba(124,58,237,0.4)",
          }}
        >
          {joinMutation.isPending ? (
            <CircleNotch className="h-4 w-4 animate-spin" />
          ) : (
            <DoorOpen className="h-4 w-4" />
          )}
          {status === "playing" ? "満員" : "参加する"}
        </button>
        {joinMutation.isError && (
          <p className="text-center text-xs animate-slide-in-bottom" style={{ color: "#f87171" }}>
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
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-all hover:opacity-80 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            borderColor: "var(--border)",
            color: "var(--text-secondary)",
            backgroundColor: "var(--bg-card)",
          }}
        >
          {leaveMutation.isPending ? (
            <CircleNotch className="h-4 w-4 animate-spin" />
          ) : (
            <SignOut className="h-4 w-4" />
          )}
          退室する
        </button>
        {isHost && (
          <button
            onClick={() => setIsConfirmOpen(true)}
            disabled={closeMutation.isPending}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-500/30 px-4 py-3 text-sm font-medium text-red-400 transition-all hover:bg-red-500/10 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: "rgba(239,68,68,0.05)" }}
          >
            {closeMutation.isPending ? (
              <CircleNotch className="h-4 w-4 animate-spin" />
            ) : (
              <Trash className="h-4 w-4" />
            )}
            解散する
          </button>
        )}
      </div>
      {leaveMutation.isError && (
        <p className="text-center text-xs animate-slide-in-bottom" style={{ color: "#f87171" }}>
          {leaveMutation.error.message}
        </p>
      )}
      {closeMutation.isError && (
        <p className="text-center text-xs animate-slide-in-bottom" style={{ color: "#f87171" }}>
          {closeMutation.error.message}
        </p>
      )}
      {isConfirmOpen && (
        <ConfirmModal
          title="部屋を解散しますか？"
          description="この操作は取り消せません。"
          confirmLabel="解散する"
          isPending={closeMutation.isPending}
          onConfirm={() => {
            closeMutation.mutate();
            setIsConfirmOpen(false);
          }}
          onCancel={() => setIsConfirmOpen(false)}
        />
      )}
    </div>
  );
}
