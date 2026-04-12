"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowLeft, FloppyDisk, Camera } from "@phosphor-icons/react";
import { type Game } from "@/lib/mock-data";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { MultiGamePicker } from "@/components/ui/GamePicker";

type UserProfile = {
  username: string;
  iconUrl: string | null;
  bio: string | null;
  games: Game[];
};

async function fetchMyProfile(): Promise<UserProfile> {
  const res = await fetch("/api/v1/users/me");
  if (!res.ok) throw new Error("failed");
  const json = (await res.json()) as { data: UserProfile };
  return json.data;
}

export default function EditProfilePage() {
  const router = useRouter();
  const { data: session, update, status } = useSession();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: profile } = useQuery({
    queryKey: ["users", "me"],
    queryFn: fetchMyProfile,
    enabled: status === "authenticated",
  });

  const [username, setUsername] = useState(session?.user?.username ?? "");
  const [iconUrl, setIconUrl] = useState<string | null>(session?.user?.iconUrl ?? null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [bio, setBio] = useState("");
  const [selectedGames, setSelectedGames] = useState<Game[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (profile && !initialized) {
      setUsername(profile.username);
      setIconUrl(profile.iconUrl);
      setBio(profile.bio ?? "");
      setSelectedGames(profile.games);
      setInitialized(true);
    }
  }, [profile, initialized]);

  useEffect(() => {
    if (!avatarFile) return;
    const url = URL.createObjectURL(avatarFile);
    setAvatarPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [avatarFile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      // アバター画像のアップロード
      if (avatarFile) {
        const formData = new FormData();
        formData.append("file", avatarFile);

        const uploadRes = await fetch("/api/v1/users/me/avatar", {
          method: "POST",
          body: formData,
        });

        const uploadJson = (await uploadRes.json()) as {
          data?: { iconUrl: string };
          error?: string;
        };

        if (!uploadRes.ok) {
          const msgMap: Record<string, string> = {
            FILE_TOO_LARGE: "画像サイズは5MB以内にしてください",
            INVALID_FILE_TYPE: "JPEG / PNG / WebP / GIF のみアップロード可能です",
            UPLOAD_FAILED: "画像のアップロードに失敗しました",
          };
          setError(msgMap[uploadJson.error ?? ""] ?? "画像のアップロードに失敗しました");
          return;
        }

        if (uploadJson.data) {
          setIconUrl(uploadJson.data.iconUrl);
        }
      }

      // プロフィール更新
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
      queryClient.invalidateQueries({ queryKey: ["users", "me"] });
      router.push("/users/me");
    } catch {
      setError("通信エラーが発生しました。再度お試しください");
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    backgroundColor: "var(--bg-input)",
    borderColor: "var(--border)",
    color: "var(--text-primary)",
  };

  const displayIconUrl = avatarPreview ?? iconUrl;

  return (
    <div className="mx-auto max-w-2xl px-4 py-4 sm:px-6 sm:py-8">
      <Link
        href="/users/me"
        className="mb-6 flex items-center gap-2 text-xl font-bold transition-colors hover:opacity-80 sm:text-2xl"
        style={{ color: "var(--text-primary)" }}
      >
        <ArrowLeft className="h-5 w-5" />
        プロフィール編集
      </Link>

      <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-6 sm:gap-8">
        {/* Avatar section */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="group relative flex-shrink-0"
            aria-label="アイコン画像を変更"
          >
            <UserAvatar
              username={username || "?"}
              iconUrl={displayIconUrl}
              size="xl"
            />
            <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100" />
            <div className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full bg-black/80">
              <Camera className="h-3.5 w-3.5 text-white" />
            </div>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Username section */}
        <div>
          <label
            className="mb-3 block text-sm font-medium"
            style={{ color: "var(--text-secondary)" }}
          >
            ユーザー名
          </label>
          <input
            type="text"
            required
            maxLength={50}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors focus:border-[var(--accent)]"
            style={inputStyle}
          />
        </div>

        {/* Bio section */}
        <div>
          <label
            className="mb-3 block text-sm font-medium"
            style={{ color: "var(--text-secondary)" }}
          >
            自己紹介
          </label>
          <textarea
            rows={3}
            placeholder="プレイスタイルや得意なゲームについて教えてください..."
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={500}
            className="w-full resize-none rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors focus:border-[var(--accent)]"
            style={inputStyle}
          />
        </div>

        {/* Games section */}
        <div>
          <label
            className="mb-3 block text-sm font-medium"
            style={{ color: "var(--text-secondary)" }}
          >
            プレイしているゲーム
          </label>
          <MultiGamePicker value={selectedGames} onChange={setSelectedGames} max={20} />
        </div>

        {/* Error */}
        {error && (
          <p className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </p>
        )}

        {/* Sticky buttons */}
        <div
          className="sticky bottom-0 flex gap-3 py-4"
          style={{ backgroundColor: "var(--bg-base)" }}
        >
          <Link
            href="/users/me"
            className="flex-1 rounded-xl border px-6 py-3 text-center text-sm font-medium transition-all hover:opacity-80"
            style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
          >
            キャンセル
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
            style={{
              background: "linear-gradient(135deg, var(--accent), #6d28d9)",
              boxShadow: "0 4px 14px rgba(124,58,237,0.4)",
            }}
          >
            <FloppyDisk className="h-4 w-4" />
            {saving ? "保存中..." : "保存する"}
          </button>
        </div>
      </form>
    </div>
  );
}
