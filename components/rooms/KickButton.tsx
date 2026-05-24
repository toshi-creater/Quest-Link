"use client";

import { useState } from "react";
import { HandWaving } from "@phosphor-icons/react";
import { useMutation } from "@tanstack/react-query";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { kickParticipant, type KickTarget } from "@/lib/api/rooms";

type Props = {
  roomId: string;
  target: KickTarget;
  targetName: string;
  onSuccess?: () => void;
};

export function KickButton({ roomId, target, targetName, onSuccess }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const kickMutation = useMutation({
    mutationFn: () => kickParticipant(roomId, target),
    onSuccess: () => {
      setIsOpen(false);
      onSuccess?.();
    },
  });

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="shrink-0 rounded p-1 transition-colors hover:bg-red-500/10"
        title={`${targetName}をキック`}
      >
        <HandWaving size={20} style={{ color: "#f87171" }} />
      </button>

      {isOpen && (
        <ConfirmModal
          title="参加者をキックしますか？"
          description={`${targetName}さんをこの部屋から退室させます。`}
          confirmLabel="キックする"
          isPending={kickMutation.isPending}
          onConfirm={() => kickMutation.mutate()}
          onCancel={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
