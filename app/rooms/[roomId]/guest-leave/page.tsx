import Link from "next/link";
import { GameController, CheckCircle, Star, PlusCircle } from "@phosphor-icons/react/dist/ssr";

const features = [
  { icon: CheckCircle, text: "プロフィールを作成して信頼度UP" },
  { icon: Star, text: "他のプレイヤーを評価・評価される" },
  { icon: PlusCircle, text: "部屋を作成・招待リンクを発行" },
];

export default function GuestLeavePage() {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
      <div
        className="flex h-16 w-16 items-center justify-center rounded-2xl mb-5"
        style={{ backgroundColor: "rgba(124,58,237,0.15)" }}
      >
        <GameController className="h-8 w-8" style={{ color: "var(--accent-light)" }} />
      </div>

      <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
        セッション終了
      </h1>
      <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
        ご参加ありがとうございました！
      </p>

      <div className="mt-8 w-full max-w-xs space-y-3 text-left">
        {features.map(({ icon: Icon, text }) => (
          <div key={text} className="flex items-center gap-3">
            <Icon className="h-4 w-4 shrink-0" style={{ color: "var(--accent-light)" }} />
            <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
              {text}
            </span>
          </div>
        ))}
      </div>

      <Link
        href="/login"
        className="mt-8 inline-flex w-full max-w-xs items-center justify-center rounded-xl px-6 py-3 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.97]"
        style={{
          background: "linear-gradient(135deg, var(--accent), #6d28d9)",
          boxShadow: "0 4px 14px rgba(124,58,237,0.4)",
        }}
      >
        ログイン / 新規登録
      </Link>
    </div>
  );
}
