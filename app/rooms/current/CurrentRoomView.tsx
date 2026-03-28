"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DoorOpen, Loader2 } from "lucide-react";
import { fetchCurrentRoom } from "@/lib/api/rooms";
import { RoomDetailView } from "../[roomId]/RoomDetailView";

export function CurrentRoomView() {
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["currentRoom"],
    queryFn: fetchCurrentRoom,
  });

  // RoomDetailView が同じデータを再フェッチしないようキャッシュに注入する
  useEffect(() => {
    if (data) {
      queryClient.setQueryData(["room", data.data.id], data);
    }
  }, [data, queryClient]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--accent)" }} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <p className="text-lg font-medium" style={{ color: "var(--text-secondary)" }}>
          情報の取得に失敗しました
        </p>
        <Link href="/rooms" className="mt-4 text-sm" style={{ color: "var(--accent-light)" }}>
          部屋一覧に戻る
        </Link>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center gap-4">
        <div
          className="flex h-16 w-16 items-center justify-center rounded-2xl"
          style={{ backgroundColor: "rgba(124,58,237,0.1)" }}
        >
          <DoorOpen className="h-8 w-8" style={{ color: "var(--accent-light)" }} />
        </div>
        <div>
          <p className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
            現在参加中の部屋はありません
          </p>
          <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
            部屋一覧から参加したい部屋を探してみましょう
          </p>
        </div>
        <Link
          href="/rooms"
          className="mt-2 rounded-lg px-5 py-2.5 text-sm font-medium text-white transition-all hover:opacity-90"
          style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-light))" }}
        >
          部屋一覧を見る
        </Link>
      </div>
    );
  }

  return <RoomDetailView roomId={data.data.id} />;
}
