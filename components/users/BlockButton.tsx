"use client";

import { useState } from "react";
import { CircleNotch } from "@phosphor-icons/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { blockUser, unblockUser } from "@/lib/api/users";

type Props = {
  userId: string;
  isBlocked: boolean;
  username: string;
};

export function BlockButton({ userId, isBlocked, username }: Props) {
  const [showConfirm, setShowConfirm] = useState(false);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => (isBlocked ? unblockUser(userId) : blockUser(userId)),
    onSuccess: () => {
      setShowConfirm(false);
      void queryClient.invalidateQueries({ queryKey: ["users", userId] });
    },
  });

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        disabled={mutation.isPending}
        className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-all hover:opacity-80 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
        style={
          isBlocked
            ? { backgroundColor: "var(--bg-card-hover)", color: "var(--text-secondary)" }
            : { backgroundColor: "rgba(239,68,68,0.08)", color: "#f87171" }
        }
      >
        {mutation.isPending && <CircleNotch className="h-4 w-4 animate-spin" />}
        {isBlocked ? "ブロック解除" : "ブロックする"}
      </button>

      {showConfirm && (
        <ConfirmModal
          title={isBlocked ? `${username} さんのブロックを解除しますか？` : `${username} さんをブロックしますか？`}
          description={
            isBlocked
              ? "ブロックを解除すると、このユーザーのコンテンツが再び表示されます。"
              : "ブロックすると、このユーザーのルームや投稿が表示されなくなります。"
          }
          confirmLabel={isBlocked ? "解除する" : "ブロックする"}
          isPending={mutation.isPending}
          onConfirm={() => mutation.mutate()}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </>
  );
}
