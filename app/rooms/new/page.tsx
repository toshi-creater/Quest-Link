"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Loader2 } from "lucide-react";
import type { Game } from "@/lib/mock-data";
import { SingleGamePicker } from "@/components/ui/GamePicker";
import { TagFilterToggle } from "@/components/ui/TagFilterToggle";
import { TagFilterPanel } from "@/components/ui/TagFilterPanel";
import { ActiveFilterBar } from "@/components/ui/ActiveFilterBar";
import { createRoom } from "@/lib/api/rooms";

type Tag = {
  id: string;
  name: string;
  slug: string;
  displayOrder: number;
  category: { id: string; name: string; slug: string } | null;
};
type TagsResponse = { data: Tag[] };

async function fetchTags(): Promise<Tag[]> {
  const res = await fetch("/api/v1/play-style-tags", { credentials: "include" });
  if (!res.ok) return [];
  const json = (await res.json()) as TagsResponse;
  return json.data;
}

export default function NewRoomPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [description, setDescription] = useState("");
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([]);
  const [pendingSlugs, setPendingSlugs] = useState<string[]>([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: tags = [] } = useQuery({
    queryKey: ["play-style-tags"],
    queryFn: fetchTags,
  });

  const mutation = useMutation({
    mutationFn: createRoom,
    onSuccess: (res) => {
      router.push(`/rooms/${res.data.id}`);
    },
    onError: (err: Error) => {
      setErrorMessage(err.message);
    },
  });

  const togglePendingSlug = (slug: string) => {
    setPendingSlugs((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  const handlePanelToggle = () => {
    if (!panelOpen) {
      setPendingSlugs(selectedSlugs);
    }
    setPanelOpen((o) => !o);
  };

  const handleApply = () => {
    setSelectedSlugs(pendingSlugs);
    setPanelOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGame) return;
    setErrorMessage(null);
    const playStyleTagIds = tags
      .filter((t) => selectedSlugs.includes(t.slug))
      .map((t) => t.id);
    mutation.mutate({
      title,
      gameId: selectedGame.id,
      maxPlayers,
      description: description || undefined,
      playStyleTagIds: playStyleTagIds.length > 0 ? playStyleTagIds : undefined,
    });
  };

  const inputStyle = {
    backgroundColor: "var(--bg-input)",
    borderColor: "var(--border)",
    color: "var(--text-primary)",
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-4 sm:py-8 sm:px-6">

      <div className="mb-4 sm:mb-6 md:text-left text-center">
        <h1 className="text-lg sm:text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          部屋作成
        </h1>
      </div>

      {errorMessage && (
        <div
          className="mb-4 rounded-xl border px-4 py-3 text-sm"
          style={{ borderColor: "rgba(239,68,68,0.4)", backgroundColor: "rgba(239,68,68,0.08)", color: "#f87171" }}
        >
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5 sm:gap-6">
        {/* Game Picker */}
        <div>
          <label className="mb-1.5 block text-sm font-medium" style={{ color: "var(--text-primary)" }}>
            ゲーム <span className="text-red-400">*</span>
          </label>
          <SingleGamePicker
            value={selectedGame}
            onChange={setSelectedGame}
            placeholder="ゲームを選択"
          />
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
            placeholder=""
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)] transition-colors"
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
        </div>

        {/* Play Style Tags */}
        <div>
          <label className="mb-1.5 block text-sm font-medium" style={{ color: "var(--text-primary)" }}>
            プレイスタイル{" "}
            <span className="text-xs font-normal" style={{ color: "var(--text-muted)" }}>
              （複数選択可）
            </span>
          </label>
          <div className="flex items-center gap-2">
            <TagFilterToggle
              selectedCount={selectedSlugs.length}
              panelOpen={panelOpen}
              onPanelToggle={handlePanelToggle}
              label="タグを選択"
            />
            {selectedSlugs.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedSlugs([])}
                className="shrink-0 text-xs transition-opacity hover:opacity-70"
                style={{ color: "var(--text-muted)" }}
              >
                すべてクリア
              </button>
            )}
          </div>
          <TagFilterPanel
            tags={tags}
            selectedTags={pendingSlugs}
            onToggle={togglePendingSlug}
            open={panelOpen}
            onApply={handleApply}
            applyLabel="決定"
          />
          <div className="mt-2 min-w-0">
            <ActiveFilterBar
              selectedTags={selectedSlugs}
              allTags={tags}
              onRemove={(slug) => setSelectedSlugs((prev) => prev.filter((s) => s !== slug))}
            />
          </div>
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
            rows={2}
            placeholder=""
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={500}
            className="w-full resize-none rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)] transition-colors"
            style={inputStyle}
          />
        </div>

        {/* Submit */}
        <div className="flex gap-3">
          <Link
            href="/rooms"
            className="flex-1 rounded-xl border px-6 py-3 text-center text-sm font-medium transition-all hover:opacity-80"
            style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
          >
            キャンセル
          </Link>
          <button
            type="submit"
            disabled={!selectedGame || !title || mutation.isPending}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white transition-all hover:opacity-90 hover:shadow-lg active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: "linear-gradient(135deg, var(--accent), #6d28d9)",
              boxShadow: selectedGame && title ? "0 4px 14px rgba(124,58,237,0.4)" : "none",
            }}
          >
            {mutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            作成する
          </button>
        </div>
      </form>
    </div>
  );
}
