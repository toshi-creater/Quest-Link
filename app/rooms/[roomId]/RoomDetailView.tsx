"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { ArrowLeft, Chat } from "@phosphor-icons/react";
import { fetchRoom, joinRoom } from "@/lib/api/rooms";
import { GuestJoinModal } from "@/components/rooms/GuestJoinModal";
import { RoomActions } from "./RoomActions";
import { InvitePanel } from "./InvitePanel";
import { RoomHeaderCard } from "./RoomHeaderCard";
import { ParticipantSidebar } from "./ParticipantSidebar";
import { BackButton } from "@/components/ui/BackButton";

type Props = { roomId: string };

export function RoomDetailView({ roomId }: Props) {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id ?? null;
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("inviteToken");
  const errorParam = searchParams.get("error");
  const needsProfileSetup = session?.user?.needsProfileSetup ?? false;
  const isNewUserError = needsProfileSetup && errorParam === "new_user";
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const queryClient = useQueryClient();
  const autoJoinAttempted = useRef(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["room", roomId],
    queryFn: () => fetchRoom(roomId),
    enabled: !!roomId,
  });

  // 招待URL + ログイン済み + 未参加 → 自動参加
  useEffect(() => {
    if (autoJoinAttempted.current) return;
    if (!inviteToken || currentUserId === null || !data) return;
    if (data.data.status === "closed") return;

    const isAlreadyParticipant =
      (currentUserId != null && data.data.participants.some((p) => p.userId === currentUserId)) ||
      data.data.isCurrentGuestParticipant;
    if (isAlreadyParticipant) return;

    autoJoinAttempted.current = true;
    joinRoom(roomId)
      .then(async () => {
        await queryClient.invalidateQueries({ queryKey: ["room", roomId] });
      })
      .catch(() => {
        autoJoinAttempted.current = false;
      });
  }, [inviteToken, currentUserId, data, roomId, queryClient]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-4 sm:py-8 sm:px-6">
        <div className="mb-6 h-5 w-20 rounded animate-shimmer" />
        <div className="grid gap-6 md:grid-cols-[1fr_260px] lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: "var(--bg-card)" }}>
              <div className="h-32 animate-shimmer" />
              <div className="px-4 py-4 sm:px-6 sm:py-5 space-y-3">
                <div className="h-6 w-2/3 rounded animate-shimmer" />
                <div className="h-4 w-full rounded animate-shimmer" />
                <div className="h-4 w-3/4 rounded animate-shimmer" />
              </div>
            </div>
            <div className="h-14 rounded-xl animate-shimmer" />
          </div>
          <div>
            <div className="rounded-2xl p-5 space-y-3" style={{ backgroundColor: "var(--bg-card)" }}>
              <div className="h-5 w-20 rounded animate-shimmer" />
              <div className="h-2 w-full rounded-full animate-shimmer" />
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full animate-shimmer shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-24 rounded animate-shimmer" />
                    <div className="h-2 w-16 rounded animate-shimmer" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <p className="text-lg font-medium" style={{ color: "var(--text-secondary)" }}>
          部屋が見つかりませんでした
        </p>
        <Link
          href="/rooms"
          className="mt-4 text-sm"
          style={{ color: "var(--accent-light)" }}
        >
          部屋一覧に戻る
        </Link>
      </div>
    );
  }

  const room = data.data;
  const currentGuestSessionId = room.currentGuestSessionId ?? null;
  const isParticipant =
    (currentUserId != null && room.participants.some((p) => p.userId === currentUserId)) ||
    room.isCurrentGuestParticipant;
  const isHost = currentUserId != null && room.host.id === currentUserId;
  const isGuest = currentUserId === null && isParticipant;

  // 招待URL + 未ログイン + 未参加 → 参加ボタン押下でダイアログを表示
  const onInviteJoinClick =
    !!inviteToken && currentUserId === null && !isParticipant
      ? () => setShowInviteDialog(true)
      : undefined;

  return (
    <div className="mx-auto max-w-5xl px-4 py-4 sm:py-8 sm:px-6">
      {/* Back */}
      <BackButton href={`/games/${room.game.id}/rooms`} className={"mb-6"} />

      <div className="grid gap-4 sm:gap-6 md:grid-cols-[1fr_260px] lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 flex flex-col gap-4 sm:gap-6">
          {/* Room Info */}
          <RoomHeaderCard room={room} />

          {/* Chat shortcut */}
          {isParticipant && (
            <Link
              href={`/rooms/${room.id}/chat`}
              className="flex items-center justify-between rounded-xl px-5 py-4 transition-all hover:brightness-110"
              style={{ backgroundColor: "var(--bg-card)" }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ backgroundColor: "rgba(124,58,237,0.15)" }}
                >
                  <Chat className="h-5 w-5" style={{ color: "var(--accent-light)" }} />
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    チャットルームへ
                  </p>
                </div>
              </div>
              <ArrowLeft className="h-4 w-4 rotate-180" style={{ color: "var(--text-muted)" }} />
            </Link>
          )}

          {/* Invite link */}
          {isHost && room.status !== "closed" && <InvitePanel roomId={room.id} />}

          {/* Actions */}
          <RoomActions
            roomId={room.id}
            isParticipant={isParticipant}
            isHost={isHost}
            isGuest={isGuest}
            status={room.status}
            onInviteJoinClick={onInviteJoinClick}
          />
        </div>

        {/* Sidebar: Participants */}
        <ParticipantSidebar
          participants={room.participants}
          maxPlayers={room.maxPlayers}
          currentPlayers={room.currentPlayers}
          currentUserId={currentUserId}
          currentGuestSessionId={currentGuestSessionId}
        />
      </div>

      {/* 統合ダイアログ: 参加ボタン押下時に表示 */}
      {showInviteDialog && !!inviteToken && (
        <GuestJoinModal
          mode="invite"
          roomId={roomId}
          inviteToken={inviteToken}
          onClose={() => setShowInviteDialog(false)}
        />
      )}
      {/* 新規ユーザーエラー: 招待URL経由でOAuth新規登録した場合（自動表示） */}
      {!!inviteToken && isNewUserError && !isParticipant && !!data && (
        <GuestJoinModal mode="newUserError" roomId={roomId} inviteToken={inviteToken} />
      )}
    </div>
  );
}
