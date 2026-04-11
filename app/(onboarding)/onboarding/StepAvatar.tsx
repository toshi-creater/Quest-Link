"use client";

import { useRef } from "react";
import { Camera } from "@phosphor-icons/react";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { OnboardingNavButtons } from "./OnboardingNavButtons";

interface StepAvatarProps {
  username: string;
  avatarPreview: string | null;
  onFileChange: (file: File) => void;
  onNext: () => void;
  onBack: () => void;
}

export function StepAvatar({ username, avatarPreview, onFileChange, onNext, onBack }: StepAvatarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
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
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onFileChange(f);
            }}
            className="hidden"
          />
        </div>
      </div>

      <OnboardingNavButtons
        primaryLabel="次へ"
        onPrimary={onNext}
        onBack={onBack}
      />
    </div>
  );
}
