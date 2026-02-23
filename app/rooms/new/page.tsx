"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import { PLAY_STYLE_TAGS, type Game } from "@/lib/mock-data";
import { SingleGamePicker } from "@/components/ui/GamePicker";

export default function NewRoomPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [description, setDescription] = useState("");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  const toggleTag = (id: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push("/rooms/room-1");
  };

  const inputStyle = {
    backgroundColor: "var(--bg-input)",
    borderColor: "var(--border)",
    color: "var(--text-primary)",
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      {/* Back */}
      <Link
        href="/rooms"
        className="mb-6 flex items-center gap-2 text-sm transition-colors hover:text-white"
        style={{ color: "var(--text-secondary)" }}
      >
        <ArrowLeft className="h-4 w-4" />
        部屋一覧に戻る
      </Link>

      <div
        className="rounded-2xl border p-8"
        style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
      >
        <div className="mb-6">
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            部屋を作る
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
            一緒にプレイする仲間を募集しましょう
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Game Picker */}
          <div>
            <label className="mb-1.5 block text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              ゲーム <span className="text-red-400">*</span>
            </label>
            <SingleGamePicker
              value={selectedGame}
              onChange={setSelectedGame}
              placeholder="ゲームを選択（IGDBから検索）"
            />
            <p className="mt-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
              ゲーム名を入力して検索し、リストから選択してください
            </p>
          </div>

          {/* Title */}
          <div>
            <label className="mb-1.5 block text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              部屋タイトル <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={100}
              placeholder="例: 深夜FPS部屋 スモーク使える方歓迎"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-purple-500 transition-colors"
              style={inputStyle}
            />
          </div>

          {/* Max Players */}
          <div>
            <label className="mb-1.5 block text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              最大人数 <span className="text-red-400">*</span>
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {[2, 3, 4, 5, 6, 8, 10, 16].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setMaxPlayers(n)}
                  className="h-10 w-10 rounded-xl text-sm font-semibold border transition-all"
                  style={
                    maxPlayers === n
                      ? {
                          backgroundColor: "rgba(124,58,237,0.3)",
                          color: "var(--accent-light)",
                          borderColor: "rgba(124,58,237,0.6)",
                        }
                      : {
                          backgroundColor: "var(--bg-input)",
                          color: "var(--text-secondary)",
                          borderColor: "var(--border)",
                        }
                  }
                >
                  {n}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
              選択中: {maxPlayers}人
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="mb-1.5 block text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              部屋の説明{" "}
              <span className="text-xs font-normal" style={{ color: "var(--text-muted)" }}>
                （任意）
              </span>
            </label>
            <textarea
              rows={3}
              placeholder="参加条件・使用ロール・プレイ方針などを記入..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
              {PLAY_STYLE_TAGS.map((tag) => {
                const active = selectedTagIds.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className="rounded-full px-3 py-1.5 text-xs font-medium border transition-all"
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

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <Link
              href="/rooms"
              className="flex-1 rounded-xl border px-6 py-3 text-center text-sm font-medium transition-all hover:opacity-80"
              style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
            >
              キャンセル
            </Link>
            <button
              type="submit"
              disabled={!selectedGame || !title}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white transition-all hover:opacity-90 hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: "linear-gradient(135deg, var(--accent), #6d28d9)",
                boxShadow: selectedGame && title ? "0 4px 14px rgba(124,58,237,0.4)" : "none",
              }}
            >
              <Plus className="h-4 w-4" />
              作成する
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
