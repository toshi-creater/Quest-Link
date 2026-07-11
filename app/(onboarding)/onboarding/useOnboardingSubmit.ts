"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { type Game } from "@/lib/mock-data";
import { toast } from "@/lib/toast";

interface UseOnboardingSubmitParams {
  avatarFile: File | null;
  username: string;
  bio: string;
  selectedGames: Game[];
  callbackUrl: string | null;
}

export function useOnboardingSubmit({
  avatarFile,
  username,
  bio,
  selectedGames,
  callbackUrl,
}: UseOnboardingSubmitParams) {
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const { update } = useSession();

  const handleSubmit = async () => {
    setSaving(true);

    try {
      if (avatarFile) {
        const formData = new FormData();
        formData.append("file", avatarFile);
        const uploadRes = await fetch("/api/v1/users/me/avatar", {
          method: "POST",
          body: formData,
        });
        if (!uploadRes.ok) {
          toast.error("画像のアップロードに失敗しました");
          return;
        }
      }

      const res = await fetch("/api/v1/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          bio: bio || null,
          gameIds: selectedGames.map((g) => g.id),
        }),
      });

      const json = (await res.json()) as { error?: string };

      if (!res.ok) {
        toast.error(json.error ?? "エラーが発生しました");
        return;
      }

      await update({ username: username.trim() });
      toast.success("プロフィールを設定しました");
      const dest = callbackUrl?.startsWith("/") ? callbackUrl : "/rooms";
      router.push(dest);
    } catch {
      toast.error("通信エラーが発生しました。再度お試しください");
    } finally {
      setSaving(false);
    }
  };

  return { handleSubmit, saving };
}
