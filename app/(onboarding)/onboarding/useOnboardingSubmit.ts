"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { type Game } from "@/lib/mock-data";

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
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { update } = useSession();

  const handleSubmit = async () => {
    setSaving(true);
    setError(null);

    try {
      if (avatarFile) {
        const formData = new FormData();
        formData.append("file", avatarFile);
        const uploadRes = await fetch("/api/v1/users/me/avatar", {
          method: "POST",
          body: formData,
        });
        if (!uploadRes.ok) {
          setError("画像のアップロードに失敗しました");
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
        setError(json.error ?? "エラーが発生しました");
        return;
      }

      await update({ username: username.trim() });
      const dest = callbackUrl?.startsWith("/") ? callbackUrl : "/rooms";
      router.push(dest);
    } catch {
      setError("通信エラーが発生しました。再度お試しください");
    } finally {
      setSaving(false);
    }
  };

  return { handleSubmit, saving, error };
}
