"use client";

import { useState } from "react";
import { HandWaving } from "@phosphor-icons/react";
import { useMutation } from "@tanstack/react-query";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { kickParticipant, type KickTarget } from "@/lib/api/rooms";
import { toast } from "@/lib/toast";

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
      toast.success("退室させました");
      setIsOpen(false);
      onSuccess?.();
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  return (
    <>
      <div className="group relative shrink-0">
        <button
          onClick={() => setIsOpen(true)}
          className="rounded p-1 transition-colors hover:bg-red-500/10"
        >
          <HandWaving size={20} style={{ color: "#f87171" }} />
        </button>
        <div className="pointer-events-none absolute bottom-full left-1/2 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-md px-2 py-1 text-xs font-medium opacity-0 transition-opacity group-hover:opacity-100"
          style={{ backgroundColor: "var(--bg-card-hover)", color: "var(--text-primary)" }}
        >
          退室させる
        </div>
      </div>

      {isOpen && (
        <ConfirmModal
          title={`${targetName} さんをこの部屋から退室させますか？`}
          description=""
          confirmLabel="はい"
          isPending={kickMutation.isPending}
          onConfirm={() => kickMutation.mutate()}
          onCancel={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
