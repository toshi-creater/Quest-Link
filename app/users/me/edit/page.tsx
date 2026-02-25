"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { type Game } from "@/lib/mock-data";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { MultiGamePicker } from "@/components/ui/GamePicker";

type PlayStyleTag = {
  id: string;
  name: string;
  slug: string;
  displayOrder: number;
};

type UserProfile = {
  username: string;
  iconUrl: string | null;
  bio: string | null;
  playStyleTags: { id: string; name: string; slug: string }[];
  games: Game[];
};

async function fetchMyProfile(): Promise<UserProfile> {
  const res = await fetch("/api/v1/users/me");
  if (!res.ok) throw new Error("failed");
  const json = (await res.json()) as { data: UserProfile };
  return json.data;
}

async function fetchPlayStyleTags(): Promise<PlayStyleTag[]> {
  const res = await fetch("/api/v1/play-style-tags");
  if (!res.ok) throw new Error("failed");
  const json = (await res.json()) as { data: PlayStyleTag[] };
  return json.data;
}

export default function EditProfilePage() {
  const router = useRouter();
  const { data: session, update, status } = useSession();

  const currentUsername = session?.user?.username ?? "";
  const isInitialSetup = status === "authenticated" && /^\d{15,}$/.test(currentUsername);

  const { data: profile } = useQuery({
    queryKey: ["users", "me"],
    queryFn: fetchMyProfile,
    enabled: status === "authenticated" && !isInitialSetup,
  });

  const { data: availableTags = [] } = useQuery({
    queryKey: ["play-style-tags"],
    queryFn: fetchPlayStyleTags,
  });

  const [username, setUsername] = useState(isInitialSetup ? "" : currentUsername);
  const [iconUrl, setIconUrl] = useState(session?.user?.iconUrl ?? "");
  const [bio, setBio] = useState("");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [selectedGames, setSelectedGames] = useState<Game[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (profile && !initialized && !isInitialSetup) {
      setUsername(profile.username);
      setIconUrl(profile.iconUrl ?? "");
      setBio(profile.bio ?? "");
      setSelectedTagIds(profile.playStyleTags.map((t) => t.id));
      setSelectedGames(profile.games);
      setInitialized(true);
    }
  }, [profile, initialized, isInitialSetup]);

  const toggleTag = (id: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const res = await fetch("/api/v1/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          bio: bio || null,
          iconUrl: iconUrl || null,
          playStyleTagIds: selectedTagIds,
          gameIds: selectedGames.map((g) => g.id),
        }),
      });

      const json = (await res.json()) as { error?: string };

      if (!res.ok) {
        setError(json.error ?? "エラーが発生しました");
        return;
      }

      await update({ username: username.trim() });
      router.push(isInitialSetup ? "/rooms" : "/users/me");
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

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      {!isInitialSetup && (
        <Link
          href="/users/me"
          className="mb-6 flex items-center gap-2 text-sm transition-colors hover:text-white"
          style={{ color: "var(--text-secondary)" }}
        >
          <ArrowLeft className="h-4 w-4" />
          プロフィールに戻る
        </Link>
      )}

      <div
        className="rounded-2xl border p-8"
        style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
      >
        <h1 className="mb-2 text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          {isInitialSetup ? "プロフィールを設定してください" : "プロフィール編集"}
        </h1>
        {isInitialSetup && (
          <p className="mb-6 text-sm" style={{ color: "var(--text-secondary)" }}>
            ユーザー名を設定するとQuestLinkを利用できます
          </p>
        )}

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
          {/* Avatar preview */}
          <div className="flex items-center gap-4">
            <UserAvatar username={username || "?"} iconUrl={iconUrl || null} size="xl" />
            <div className="flex-1">
              <label className="mb-1.5 block text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                アイコン URL{" "}
                <span className="text-xs font-normal" style={{ color: "var(--text-muted)" }}>
                  （任意）
                </span>
              </label>
              <input
                type="url"
                placeholder="https://example.com/icon.png"
                value={iconUrl}
                onChange={(e) => setIconUrl(e.target.value)}
                className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-purple-500 transition-colors"
                style={inputStyle}
              />
            </div>
          </div>

          {/* Username */}
          <div>
            <label className="mb-1.5 block text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              ユーザー名 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={50}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-purple-500 transition-colors"
              style={inputStyle}
            />
          </div>

          {/* Bio */}
          <div>
            <label className="mb-1.5 block text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              自己紹介{" "}
              <span className="text-xs font-normal" style={{ color: "var(--text-muted)" }}>
                （任意・500文字以内）
              </span>
            </label>
            <textarea
              rows={4}
              placeholder="プレイスタイルや得意なゲームについて教えてください..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={500}
              className="w-full resize-none rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-purple-500 transition-colors"
              style={inputStyle}
            />
          </div>

          {/* Play Style Tags */}
          <div>
            <label className="mb-1.5 block text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              プレイスタイル{" "}
              <span className="text-xs font-normal" style={{ color: "var(--text-muted)" }}>
                （複数選択可）
              </span>
            </label>
            <div className="flex flex-wrap gap-2">
              {availableTags.map((tag) => {
                const active = selectedTagIds.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className="rounded-full border px-3 py-1.5 text-xs font-medium transition-all"
                    style={
                      active
                        ? {
                            backgroundColor: "rgba(124,58,237,0.3)",
                            color: "var(--accent-light)",
                            borderColor: "rgba(124,58,237,0.6)",
                          }
                        : {
                            backgroundColor: "transparent",
                            color: "var(--text-secondary)",
                            borderColor: "var(--border)",
                          }
                    }
                  >
                    {tag.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Game Picker */}
          <div>
            <label className="mb-1.5 block text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              プレイしているゲーム{" "}
              <span className="text-xs font-normal" style={{ color: "var(--text-muted)" }}>
                （最大20件・IGDBから検索）
              </span>
            </label>
            <MultiGamePicker value={selectedGames} onChange={setSelectedGames} max={20} />
            <p className="mt-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
              ゲーム名を入力して検索し、プレイしているゲームを登録できます
            </p>
          </div>

          {/* Error */}
          {error && (
            <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </p>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            {!isInitialSetup && (
              <Link
                href="/users/me"
                className="flex-1 rounded-xl border px-6 py-3 text-center text-sm font-medium transition-all hover:opacity-80"
                style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
              >
                キャンセル
              </Link>
            )}
            <button
              type="submit"
              disabled={saving}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
              style={{
                background: "linear-gradient(135deg, var(--accent), #6d28d9)",
                boxShadow: "0 4px 14px rgba(124,58,237,0.4)",
              }}
            >
              <Save className="h-4 w-4" />
              {saving ? "保存中..." : isInitialSetup ? "はじめる" : "保存する"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
