"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Check, ArrowLeft, CaretRight, Camera } from "@phosphor-icons/react";
import { Logo } from "@/components/ui/Logo";
import { type Game } from "@/lib/mock-data";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { GridGamePicker } from "@/components/ui/GamePicker";

const TOTAL_STEPS = 5;

export default function OnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const { data: session, update, status } = useSession();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentStep, setCurrentStep] = useState(1);
  const [username, setUsername] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [bio, setBio] = useState("");
  const [selectedGames, setSelectedGames] = useState<Game[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!avatarFile) return;
    const url = URL.createObjectURL(avatarFile);
    setAvatarPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [avatarFile]);

  useEffect(() => {
    if (status === "authenticated" && !session?.user?.needsProfileSetup) {
      router.replace("/users/me");
    }
  }, [status, session, router]);

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

  const inputStyle = {
    backgroundColor: "var(--bg-input)",
    borderColor: "var(--border)",
    color: "var(--text-primary)",
  };

  const valueProps = [
    "プレイしているゲームで相性の良い仲間を探せる",
    "評価システムで安心して知らない人と組める",
    "部屋作成・参加は30秒でできる",
  ];

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-6 py-16 sm:px-10"
      style={{ backgroundColor: "var(--bg-base)" }}
    >
      <div className="w-full max-w-md">

        {/* Logo — 常に表示 */}
        <div className="mb-10 flex justify-center">
          <Logo height={64} />
        </div>

        {/* Progress dots — 常にレンダリング（step 1 は invisible で高さ確保） */}
        <div className={`mb-8 flex items-center justify-center gap-2 ${currentStep === 1 ? "invisible" : ""}`}>
          {Array.from({ length: TOTAL_STEPS - 1 }, (_, i) => {
            const step = i + 2;
            const isCompleted = step < currentStep;
            const isCurrent = step === currentStep;
            return (
              <div
                key={step}
                className="h-1.5 w-1.5 rounded-full transition-all"
                style={
                  isCompleted
                    ? { backgroundColor: "var(--accent)" }
                    : isCurrent
                      ? { backgroundColor: "var(--accent-light)", transform: "scale(1.4)" }
                      : { backgroundColor: "var(--border)" }
                }
              />
            );
          })}
        </div>

        {/* Step 1: ウェルカム */}
        {currentStep === 1 && (
          <div className="animate-fade-in-up flex flex-col min-h-[38rem] space-y-12">
            <div className="space-y-10">
              <div>
                <h1
                  className="mb-3 text-3xl font-bold leading-snug"
                  style={{ color: "var(--text-primary)" }}
                >
                  今すぐ、ゲーム仲間と<br />繋がろう
                </h1>
                <p className="text-base" style={{ color: "var(--text-secondary)" }}>
                  知らない人と安心して組める、ゲーマー向けマッチングプラットフォーム。
                </p>
              </div>

              <ul className="space-y-4">
                {valueProps.map((prop) => (
                  <li key={prop} className="flex items-start gap-3">
                    <span
                      className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                      style={{ backgroundColor: "rgba(124,58,237,0.25)" }}
                    >
                      <Check className="h-3 w-3" style={{ color: "var(--accent-light)" }} />
                    </span>
                    <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                      {prop}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{
                background: "linear-gradient(135deg, var(--accent), #6d28d9)",
                boxShadow: "0 4px 14px rgba(124,58,237,0.4)",
              }}
            >
              次へ
              <CaretRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Step 2: ユーザー名 */}
        {currentStep === 2 && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (username.trim()) setCurrentStep(3);
            }}
            className="animate-fade-in-up flex flex-col min-h-[38rem] space-y-10"
          >
            <div className="space-y-8">
              <div>
                <h1 className="mb-1 text-2xl sm:text-3xl font-bold" style={{ color: "var(--text-primary)" }}>
                  ユーザー名を決めましょう
                </h1>
                <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                  あなたを表す名前を設定してください。後から変更できます。
                </p>
              </div>

              <div>
                <label
                  className="mb-1.5 block text-sm font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  ユーザー名 <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={50}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)] transition-colors"
                  style={inputStyle}
                />
                <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                  ユーザー名は後からいつでも変更できます
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="flex flex-1 items-center justify-center gap-1 rounded-xl border px-4 py-3 text-sm font-medium transition-all hover:opacity-80"
                style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
              >
                <ArrowLeft className="h-4 w-4" />
                戻る
              </button>
              <button
                type="submit"
                disabled={username.trim() === ""}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
                style={{
                  background: "linear-gradient(135deg, var(--accent), #6d28d9)",
                  boxShadow: "0 4px 14px rgba(124,58,237,0.4)",
                }}
              >
                次へ
                <CaretRight className="h-4 w-4" />
              </button>
            </div>
          </form>
        )}

        {/* Step 3: 自己紹介 */}
        {currentStep === 3 && (
          <div className="animate-fade-in-up flex flex-col min-h-[38rem] space-y-10">
            <div className="space-y-8">
              <div>
                <h1 className="mb-1 text-2xl sm:text-3xl font-bold" style={{ color: "var(--text-primary)" }}>
                  自己紹介を書きましょう
                </h1>
                <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                  プレイスタイルや得意ジャンルを伝えると、仲間が見つかりやすくなります。
                </p>
              </div>

              <div>
                <label
                  className="mb-1.5 block text-sm font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
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
                  className="w-full resize-none rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)] transition-colors"
                  style={inputStyle}
                />
                <p className="mt-1 text-right text-xs" style={{ color: "var(--text-muted)" }}>
                  {bio.length}/500
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="flex flex-1 items-center justify-center gap-1 rounded-xl border px-4 py-3 text-sm font-medium transition-all hover:opacity-80"
                  style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
                >
                  <ArrowLeft className="h-4 w-4" />
                  戻る
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(4)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white transition-all hover:opacity-90"
                  style={{
                    background: "linear-gradient(135deg, var(--accent), #6d28d9)",
                    boxShadow: "0 4px 14px rgba(124,58,237,0.4)",
                  }}
                >
                  次へ
                  <CaretRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: プロフィール画像 */}
        {currentStep === 4 && (
          <div className="animate-fade-in-up flex flex-col min-h-[38rem] space-y-10">
            <div className="space-y-8">
              <div>
                <h1 className="mb-1 text-2xl sm:text-3xl font-bold" style={{ color: "var(--text-primary)" }}>
                  プロフィール画像を設定
                </h1>
                <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                  アイコン画像を設定してください。後から変更できます。
                </p>
              </div>

              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="group relative flex-shrink-0"
                  aria-label="アイコン画像を選択"
                >
                  <UserAvatar username={username || "?"} iconUrl={avatarPreview} size="xl" />
                  <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100" />
                  <div className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full bg-black/80">
                    <Camera className="h-3.5 w-3.5 text-white" />
                  </div>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) setAvatarFile(f); }}
                  className="hidden"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="flex flex-1 items-center justify-center gap-1 rounded-xl border px-4 py-3 text-sm font-medium transition-all hover:opacity-80"
                style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
              >
                <ArrowLeft className="h-4 w-4" />
                戻る
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(5)}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white transition-all hover:opacity-90"
                style={{
                  background: "linear-gradient(135deg, var(--accent), #6d28d9)",
                  boxShadow: "0 4px 14px rgba(124,58,237,0.4)",
                }}
              >
                次へ
                <CaretRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 5: ゲーム選択 */}
        {currentStep === 5 && (
          <div className="animate-fade-in-up flex flex-col justify-between min-h-[38rem]">
            <div className="space-y-8">
              <div>
                <h1 className="mb-1 text-2xl sm:text-3xl font-bold" style={{ color: "var(--text-primary)" }}>
                  プレイしているゲームを登録
                </h1>
                <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                  プレイするゲームを登録すると、ゲーム仲間が見つかりやすくなります。
                </p>
              </div>

              <GridGamePicker value={selectedGames} onChange={setSelectedGames} max={20} />

              {error && (
                <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  {error}
                </p>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                className="flex flex-1 items-center justify-center gap-1 rounded-xl border px-4 py-3 text-sm font-medium transition-all hover:opacity-80"
                style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
              >
                <ArrowLeft className="h-4 w-4" />
                戻る
              </button>
              <button
                type="button"
                disabled={status === "loading" || saving}
                onClick={() => void handleSubmit()}
                className="flex flex-1 items-center justify-center rounded-xl px-6 py-3 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
                style={{
                  background: "linear-gradient(135deg, var(--accent), #6d28d9)",
                  boxShadow: "0 4px 14px rgba(124,58,237,0.4)",
                }}
              >
                {saving ? "設定中..." : "はじめる"}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
